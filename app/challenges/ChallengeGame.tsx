"use client";

import { useEffect, useMemo, useState } from "react";

type MissionId = "token" | "customer" | "primary" | "secondary" | "deposit" | "transfer" | "verify" | "overdraft" | "rename" | "deleteFunded";
type GameState = {
  token: string;
  expiresAt: number;
  customerId: string;
  primaryAccountId: string;
  secondaryAccountId: string;
  completed: MissionId[];
  attempts: number;
  streak: number;
};
type ApiResult = { status: number; elapsed: number; data: unknown; passed: boolean };
type Mission = {
  id: MissionId;
  chapter: string;
  title: string;
  objective: string;
  method: "GET" | "POST" | "PATCH" | "DELETE";
  expected: number;
  path: (state: GameState) => string;
  body?: (state: GameState) => string;
  hints?: string[];
};

const emptyGame: GameState = {
  token: "",
  expiresAt: 0,
  customerId: "",
  primaryAccountId: "",
  secondaryAccountId: "",
  completed: [],
  attempts: 0,
  streak: 0,
};

const missions: Mission[] = [
  {
    id: "token",
    chapter: "Mission 01",
    title: "Unlock the vault",
    objective: "Authenticate and receive a temporary Bearer token.",
    method: "POST",
    expected: 201,
    path: () => "/api/v1/auth/token",
    body: () => JSON.stringify({ email: "learner@example.test", password: "practice-password", expires_in: 900 }, null, 2),
    hints: ["email: learner@example.test", "password: practice-password", "expires_in: 900, 1800, 2700, or 3600"],
  },
  {
    id: "customer",
    chapter: "Mission 02",
    title: "Onboard your customer",
    objective: "Create Betappa Bharath and capture the returned Customer ID.",
    method: "POST",
    expected: 201,
    path: () => "/api/v1/customers",
    body: () => JSON.stringify({ firstName: "Betappa", middleName: "", lastName: "Bharath", dateOfBirth: "2000-07-17", isMinorCustomer: false, gender: "M", birthCountry: "IN", nationality: "IN" }, null, 2),
    hints: ["firstName: Betappa", "lastName: Bharath", "dateOfBirth: 2000-07-17", "isMinorCustomer: false", "gender: M", "birthCountry and nationality: IN"],
  },
  {
    id: "primary",
    chapter: "Mission 03",
    title: "Open the salary account",
    objective: "Create the first savings account with a zero opening balance.",
    method: "POST",
    expected: 201,
    path: (state) => `/api/v1/customers/${state.customerId || "{customerId}"}/accounts`,
    body: () => JSON.stringify({ accountType: "savings", nickname: "Salary Account", openingBalance: 0 }, null, 2),
    hints: ["accountType: savings", "nickname: Salary Account", "openingBalance: 0"],
  },
  {
    id: "secondary",
    chapter: "Mission 04",
    title: "Open the goal account",
    objective: "Create a second account for the same customer.",
    method: "POST",
    expected: 201,
    path: (state) => `/api/v1/customers/${state.customerId || "{customerId}"}/accounts`,
    body: () => JSON.stringify({ accountType: "savings", nickname: "Goal Account", openingBalance: 0 }, null, 2),
    hints: ["accountType: savings", "nickname: Goal Account", "openingBalance: 0"],
  },
  {
    id: "deposit",
    chapter: "Mission 05",
    title: "Fund the salary account",
    objective: "Credit INR 10,000 and verify the transaction response.",
    method: "POST",
    expected: 201,
    path: (state) => `/api/v1/accounts/${state.primaryAccountId || "{accountId}"}/transactions`,
    body: () => JSON.stringify({ type: "credit", amount: 10000, reference: "Challenge salary credit" }, null, 2),
    hints: ["type: credit", "amount: 10000", "reference: Challenge salary credit"],
  },
  {
    id: "transfer",
    chapter: "Mission 06",
    title: "Complete the transfer",
    objective: "Move INR 2,000 from the salary account to the goal account.",
    method: "POST",
    expected: 201,
    path: () => "/api/v1/transfers",
    body: (state) => JSON.stringify({ fromAccountId: state.primaryAccountId || "{primaryAccountId}", toAccountId: state.secondaryAccountId || "{secondaryAccountId}", amount: 2000 }, null, 2),
    hints: ["fromAccountId: use the saved Salary Account ID", "toAccountId: use the saved Goal Account ID", "amount: 2000"],
  },
  {
    id: "verify",
    chapter: "Mission 07",
    title: "Audit the final balance",
    objective: "Read the salary account and inspect its balance and transaction history.",
    method: "GET",
    expected: 200,
    path: (state) => `/api/v1/accounts/${state.primaryAccountId || "{accountId}"}`,
  },
  {
    id: "overdraft",
    chapter: "Boss Mission 08",
    title: "Prove insufficient funds",
    objective: "Attempt to debit INR 5,000 from the goal account and produce the correct client error.",
    method: "POST",
    expected: 422,
    path: (state) => `/api/v1/accounts/${state.secondaryAccountId || "{accountId}"}/transactions`,
    body: () => JSON.stringify({ type: "debit", amount: 5000, reference: "Overdraft test" }, null, 2),
    hints: ["type: debit", "amount: 5000", "reference: Overdraft test", "Expected response: 422 Unprocessable Entity"],
  },
  {
    id: "rename",
    chapter: "Boss Mission 09",
    title: "Patch the goal account",
    objective: "Use a partial update to rename the goal account to Emergency Fund.",
    method: "PATCH",
    expected: 200,
    path: (state) => `/api/v1/accounts/${state.secondaryAccountId || "{accountId}"}`,
    body: () => JSON.stringify({ nickname: "Emergency Fund" }, null, 2),
    hints: ["nickname: Emergency Fund", "Use a partial-update HTTP method", "Only send the field being changed"],
  },
  {
    id: "deleteFunded",
    chapter: "Final Boss 10",
    title: "Defend a funded account",
    objective: "Attempt to delete the funded goal account and verify that the banking rule blocks it.",
    method: "DELETE",
    expected: 409,
    path: (state) => `/api/v1/accounts/${state.secondaryAccountId || "{accountId}"}`,
    hints: ["No request body is required", "Use the Goal Account ID", "Expected response: 409 Conflict"],
  },
];

function responseObject(data: unknown): Record<string, unknown> {
  return data && typeof data === "object" ? data as Record<string, unknown> : {};
}

function nestedData(data: unknown): Record<string, unknown> {
  const outer = responseObject(data);
  return responseObject(outer.data);
}

function missionResponseIsValid(id: MissionId, data: unknown) {
  const outer = responseObject(data);
  const inner = nestedData(data);
  if (id === "token") return typeof outer.access_token === "string" && typeof outer.expires_at === "string";
  if (id === "customer") return String(inner.id ?? "").startsWith("CUST-");
  if (id === "primary" || id === "secondary") return String(inner.id ?? "").startsWith("ACC-");
  if (id === "deposit") return String(inner.id ?? "").startsWith("TXN-") && typeof outer.balance === "number";
  if (id === "transfer") return typeof inner.reference === "string" && Boolean(inner.fromAccount) && Boolean(inner.toAccount);
  if (id === "verify") return String(inner.id ?? "").startsWith("ACC-") && inner.balance === 8000 && Array.isArray(outer.transactions);
  if (id === "overdraft") return outer.error === "Insufficient funds";
  if (id === "rename") return String(inner.id ?? "").startsWith("ACC-") && inner.nickname === "Emergency Fund";
  if (id === "deleteFunded") return outer.error === "Account has balance";
  return false;
}

function validateMissionRequest(id: MissionId, value: unknown, game: GameState) {
  const body = responseObject(value);
  if (id === "token") {
    if (body.email !== "learner@example.test" || body.password !== "practice-password") return "Use the challenge email and password shown in the hints.";
    if (![900, 1800, 2700, 3600].includes(Number(body.expires_in))) return "expires_in must be 900, 1800, 2700, or 3600 seconds.";
  }
  if (id === "customer" && (body.firstName !== "Betappa" || body.lastName !== "Bharath" || body.dateOfBirth !== "2000-07-17" || body.isMinorCustomer !== false || body.gender !== "M" || body.birthCountry !== "IN" || body.nationality !== "IN")) return "Use every required Betappa Bharath customer value shown in the hints.";
  if (id === "primary" && (body.accountType !== "savings" || body.nickname !== "Salary Account" || Number(body.openingBalance) !== 0)) return "Create a savings account named Salary Account with openingBalance 0.";
  if (id === "secondary" && (body.accountType !== "savings" || body.nickname !== "Goal Account" || Number(body.openingBalance) !== 0)) return "Create a savings account named Goal Account with openingBalance 0.";
  if (id === "deposit" && (body.type !== "credit" || Number(body.amount) !== 10000 || body.reference !== "Challenge salary credit")) return "Credit exactly 10000 with the required challenge reference.";
  if (id === "transfer" && (body.fromAccountId !== game.primaryAccountId || body.toAccountId !== game.secondaryAccountId || Number(body.amount) !== 2000)) return "Use the saved account IDs and transfer exactly 2000.";
  if (id === "overdraft" && (body.type !== "debit" || Number(body.amount) !== 5000 || body.reference !== "Overdraft test")) return "Attempt a debit of exactly 5000 with the Overdraft test reference.";
  if (id === "rename" && (body.nickname !== "Emergency Fund" || Object.keys(body).length !== 1)) return "Send only the new nickname: Emergency Fund.";
  return "";
}

function normalizeRequestPath(input: string, origin: string) {
  try {
    const url = new URL(input.trim(), origin);
    if (url.origin !== origin) return { path: "", error: "Use this TestLab's live domain, not an external website." };
    return { path: `${url.pathname}${url.search}`, error: "" };
  } catch {
    return { path: "", error: "Enter a valid relative path or complete URL." };
  }
}

function emptyRequestBody(mission: Mission) {
  return mission.body ? "{\n  \n}" : "";
}

type MissionDraft = {
  method: string;
  url: string;
  body: string;
  showHints: boolean;
};

type ChallengeWorkspace = {
  selected: number;
  drafts: Record<string, MissionDraft>;
};

const workspaceStorageKey = "bbl-challenge-workspace-v1";

function emptyMissionDraft(mission: Mission): MissionDraft {
  return { method: "", url: "", body: emptyRequestBody(mission), showHints: false };
}

function readChallengeWorkspace(): ChallengeWorkspace {
  try {
    const saved = sessionStorage.getItem(workspaceStorageKey);
    if (saved) return { selected: 0, drafts: {}, ...JSON.parse(saved) };
  } catch {
    sessionStorage.removeItem(workspaceStorageKey);
  }
  return { selected: 0, drafts: {} };
}

function rankFor(completed: number) {
  if (completed === missions.length) return "Banking API Champion";
  if (completed >= 8) return "Automation Ace";
  if (completed >= 5) return "Banking Tester";
  if (completed >= 2) return "API Explorer";
  return "QA Rookie";
}

function remainingTime(milliseconds: number) {
  if (milliseconds <= 0) return "Expired";
  const total = Math.ceil(milliseconds / 1000);
  return `${Math.floor(total / 60)}m ${total % 60}s remaining`;
}

export default function ChallengeGame() {
  const [game, setGame] = useState<GameState>(emptyGame);
  const [selected, setSelected] = useState(0);
  const [body, setBody] = useState(emptyRequestBody(missions[0]));
  const [origin, setOrigin] = useState("");
  const [result, setResult] = useState<ApiResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("Start with Mission 01 to create your secure practice session.");
  const [now, setNow] = useState(0);
  const [ready, setReady] = useState(false);
  const [showHints, setShowHints] = useState(false);
  const [requestMethod, setRequestMethod] = useState("");
  const [requestUrl, setRequestUrl] = useState("");
  const [achievementCopied, setAchievementCopied] = useState(false);

  const mission = missions[selected];
  const score = game.completed.length * 100;
  const progress = Math.round(game.completed.length / missions.length * 100);
  const tokenActive = Boolean(game.token) && game.expiresAt > now;
  const currentPath = mission.path(game);
  const needsBody = Boolean(mission.body);
  const isComplete = game.completed.includes(mission.id);
  const nextMission = missions.findIndex((item) => !game.completed.includes(item.id));
  const gameComplete = game.completed.length === missions.length;
  const practisedStatuses = Array.from(new Set(missions.filter((item) => game.completed.includes(item.id)).map((item) => item.expected)));

  const prerequisite = useMemo(() => {
    if (mission.id === "token") return "";
    if (!tokenActive) return "Generate an active token in Mission 01 first.";
    if (["primary", "secondary"].includes(mission.id) && !game.customerId) return "Create a customer in Mission 02 first.";
    if (["deposit", "verify"].includes(mission.id) && !game.primaryAccountId) return "Create the salary account in Mission 03 first.";
    if (mission.id === "transfer" && (!game.primaryAccountId || !game.secondaryAccountId || !game.completed.includes("deposit"))) return "Create both accounts and complete the deposit mission first.";
    if (["verify", "overdraft", "rename", "deleteFunded"].includes(mission.id) && !game.completed.includes("transfer")) return "Complete the transfer mission before entering the advanced levels.";
    return "";
  }, [mission.id, tokenActive, game.customerId, game.primaryAccountId, game.secondaryAccountId, game.completed]);

  useEffect(() => {
    setOrigin(window.location.origin);
    setNow(Date.now());
    try {
      sessionStorage.removeItem("bbl-challenge-game");
      sessionStorage.removeItem("bbl-challenge-game-v3");
      const saved = sessionStorage.getItem("bbl-challenge-game-v4");
      const workspace = readChallengeWorkspace();
      if (saved) {
        const restored = { ...emptyGame, ...JSON.parse(saved) } as GameState;
        setGame(restored);
        const firstOpen = missions.findIndex((item) => !restored.completed.includes(item.id));
        const fallbackIndex = firstOpen < 0 ? missions.length - 1 : firstOpen;
        const index = Number.isInteger(workspace.selected) && workspace.selected >= 0 && workspace.selected < missions.length ? workspace.selected : fallbackIndex;
        const draft = workspace.drafts[missions[index].id] ?? emptyMissionDraft(missions[index]);
        setSelected(index);
        setBody(draft.body);
        setRequestMethod(draft.method);
        setRequestUrl(draft.url);
        setShowHints(draft.showHints);
        setMessage(restored.completed.length === missions.length ? "Challenge completed. Your champion badge is ready." : "Your challenge session has been restored.");
      } else {
        const index = Number.isInteger(workspace.selected) && workspace.selected >= 0 && workspace.selected < missions.length ? workspace.selected : 0;
        const draft = workspace.drafts[missions[index].id] ?? emptyMissionDraft(missions[index]);
        setSelected(index);
        setBody(draft.body);
        setRequestMethod(draft.method);
        setRequestUrl(draft.url);
        setShowHints(draft.showHints);
      }
    } catch {
      sessionStorage.removeItem("bbl-challenge-game-v4");
    }
    setReady(true);
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (ready) sessionStorage.setItem("bbl-challenge-game-v4", JSON.stringify(game));
  }, [game, ready]);

  useEffect(() => {
    if (!ready) return;
    const workspace = readChallengeWorkspace();
    workspace.selected = selected;
    workspace.drafts[mission.id] = { method: requestMethod, url: requestUrl, body, showHints };
    sessionStorage.setItem(workspaceStorageKey, JSON.stringify(workspace));
  }, [body, mission.id, ready, requestMethod, requestUrl, selected, showHints]);

  function chooseMission(index: number) {
    const workspace = readChallengeWorkspace();
    workspace.drafts[mission.id] = { method: requestMethod, url: requestUrl, body, showHints };
    workspace.selected = index;
    sessionStorage.setItem(workspaceStorageKey, JSON.stringify(workspace));
    const draft = workspace.drafts[missions[index].id] ?? emptyMissionDraft(missions[index]);
    setSelected(index);
    setBody(draft.body);
    setShowHints(draft.showHints);
    setRequestMethod(draft.method);
    setRequestUrl(draft.url);
    setResult(null);
    setMessage(missions[index].objective);
  }

  function resetGame() {
    setGame(emptyGame);
    setSelected(0);
    setBody(emptyRequestBody(missions[0]));
    setShowHints(false);
    setRequestMethod("");
    setRequestUrl("");
    setResult(null);
    setMessage("New game created. Generate a token to begin.");
    sessionStorage.removeItem("bbl-challenge-game");
    sessionStorage.removeItem("bbl-challenge-game-v3");
    sessionStorage.removeItem("bbl-challenge-game-v4");
    sessionStorage.removeItem(workspaceStorageKey);
  }

  function clearBody() {
    setBody(emptyRequestBody(mission));
    setMessage("Request body cleared. Write the JSON needed for this mission.");
  }

  function formatBody() {
    try {
      setBody(JSON.stringify(JSON.parse(body), null, 2));
      setMessage("JSON formatted successfully.");
    } catch {
      setMessage("The request body is not valid JSON. Check commas, quotes, and braces.");
    }
  }

  async function sendRequest(event: React.FormEvent) {
    event.preventDefault();
    if (prerequisite || loading) return;
    if (!requestMethod) {
      setMessage("Challenge check failed: choose an HTTP method.");
      return;
    }
    if (requestMethod !== mission.method) {
      setGame((current) => ({ ...current, attempts: current.attempts + 1, streak: 0 }));
      setMessage(`Challenge check failed: ${requestMethod} is not the correct method for this mission.`);
      return;
    }
    if (!requestUrl.trim()) {
      setMessage("Challenge check failed: enter the request URL yourself.");
      return;
    }
    const normalized = normalizeRequestPath(requestUrl, origin);
    if (normalized.error) {
      setMessage(`Challenge check failed: ${normalized.error}`);
      return;
    }
    if (normalized.path !== currentPath) {
      setGame((current) => ({ ...current, attempts: current.attempts + 1, streak: 0 }));
      setMessage("Challenge check failed: the URL does not match this mission or contains the wrong saved ID.");
      return;
    }
    let parsedBody: unknown;
    if (needsBody) {
      try {
        parsedBody = JSON.parse(body);
      } catch {
        setMessage("Mission not sent: correct the invalid JSON request body.");
        return;
      }
      const missionError = validateMissionRequest(mission.id, parsedBody, game);
      if (missionError) {
        setGame((current) => ({ ...current, attempts: current.attempts + 1, streak: 0 }));
        setMessage(`Challenge check failed: ${missionError}`);
        return;
      }
    }

    setLoading(true);
    setResult(null);
    const started = performance.now();
    try {
      const headers: Record<string, string> = { Accept: "application/json" };
      if (needsBody) headers["Content-Type"] = "application/json";
      if (mission.id !== "token") headers.Authorization = `Bearer ${game.token}`;
      const response = await fetch(normalized.path, { method: requestMethod, headers, body: needsBody ? JSON.stringify(parsedBody) : undefined });
      const data = response.status === 204 ? null : await response.json();
      const elapsed = Math.round(performance.now() - started);
      const statusPassed = response.status === mission.expected;
      const responsePassed = missionResponseIsValid(mission.id, data);
      const passed = statusPassed && responsePassed;
      setResult({ status: response.status, elapsed, data, passed });
      if (!passed) {
        setGame((current) => ({ ...current, attempts: current.attempts + 1, streak: 0 }));
        setMessage(statusPassed ? "The status passed, but required response fields are missing. Inspect the JSON and retry." : `Mission needs another attempt. Expected ${mission.expected}, received ${response.status}.`);
        return;
      }

      const outer = responseObject(data);
      const inner = nestedData(data);
      setGame((current) => {
        if (mission.id === "token") {
          return {
            ...emptyGame,
            token: String(outer.access_token ?? ""),
            expiresAt: Date.parse(String(outer.expires_at ?? "")),
            completed: ["token"],
            attempts: current.attempts + 1,
            streak: current.streak + 1,
          };
        }
        const updated: GameState = { ...current, attempts: current.attempts + 1, streak: current.streak + 1 };
        if (mission.id === "customer") updated.customerId = String(inner.id ?? "");
        if (mission.id === "primary") updated.primaryAccountId = String(inner.id ?? "");
        if (mission.id === "secondary") updated.secondaryAccountId = String(inner.id ?? "");
        updated.completed = Array.from(new Set([...current.completed, mission.id]));
        return updated;
      });
      setMessage(`Mission complete! +100 XP. Review the response, then continue.`);
    } catch {
      setGame((current) => ({ ...current, attempts: current.attempts + 1, streak: 0 }));
      setResult({ status: 0, elapsed: 0, data: { error: "Request could not be sent" }, passed: false });
      setMessage("The request could not reach the API. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  function continueGame() {
    const next = missions.findIndex((item) => !game.completed.includes(item.id));
    chooseMission(next < 0 ? missions.length - 1 : next);
  }

  async function copyAchievement() {
    const text = `I completed the Banking API Quest in BetappaBharath API TestLab!\n\nScore: ${score}/${missions.length * 100} XP\nMissions: ${game.completed.length}/${missions.length}\nStatus codes practised: ${practisedStatuses.join(", ")}\n\nTry it: ${window.location.origin}/challenges`;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const field = document.createElement("textarea");
      field.value = text;
      document.body.appendChild(field);
      field.select();
      document.execCommand("copy");
      field.remove();
    }
    setAchievementCopied(true);
    window.setTimeout(() => setAchievementCopied(false), 2200);
  }

  return <main className="challenge-game-page">
    <header className="game-nav">
      <a className="game-brand" href="/"><span>B</span><strong>BetappaBharath <em>API TestLab</em></strong></a>
      <nav><a href="#how-to-play">How to play</a><a href="/#playground">Free Practice</a><a href="/swagger">Swagger</a><a href="/guide">User Guide</a></nav>
    </header>

    <section className="game-hero">
      <div><p>Banking API Quest</p><h1>Build each request. Beat every mission. <span>Become the champion.</span></h1><small>Choose the correct HTTP method, enter the URL, write the JSON, and inspect the live response. Nothing is completed for you.</small></div>
      <div className="player-card"><div><span>Current rank</span><b>{rankFor(game.completed.length)}</b></div><div className="xp-ring" style={{ "--progress": `${progress * 3.6}deg` } as React.CSSProperties}><strong>{score}</strong><span>XP</span></div></div>
    </section>

    <section className="game-stats" aria-label="Challenge progress">
      <div><span>Progress</span><b>{game.completed.length}/{missions.length} missions</b><i><em style={{ width: `${progress}%` }} /></i></div>
      <div><span>Winning streak</span><b>{game.streak} successful request{game.streak === 1 ? "" : "s"}</b></div>
      <div><span>Attempts</span><b>{game.attempts}</b></div>
      <div><span>Session token</span><b className={tokenActive ? "game-ready" : "game-waiting"}>{tokenActive ? remainingTime(game.expiresAt - now) : "Not active"}</b></div>
      <button type="button" onClick={resetGame}>New game</button>
    </section>

    <details className="game-how-to" id="how-to-play">
      <summary><span>?</span><div><b>New here? Learn how to play</b><small>A quick walkthrough of the rules, requests, hints, and scoring</small></div><i>Open guide</i></summary>
      <div className="how-to-content">
        <ol>
          <li><span>1</span><div><b>Choose a mission</b><p>Start with authentication. Later missions use the customer and account IDs you earn.</p></div></li>
          <li><span>2</span><div><b>Build the complete request</b><p>Select the HTTP method, type the endpoint URL, and write the JSON body yourself.</p></div></li>
          <li><span>3</span><div><b>Use help when needed</b><p>Open the challenge hints or Swagger reference. Your unfinished request is saved automatically.</p></div></li>
          <li><span>4</span><div><b>Send and inspect</b><p>Compare the actual status and response with the expected result. Fix the request and retry if it fails.</p></div></li>
          <li><span>5</span><div><b>Earn XP and unlock levels</b><p>Every correctly completed mission awards 100 XP. Finish all 10 missions to become Banking API Champion.</p></div></li>
        </ol>
        <aside><b>Game rules</b><ul><li>Hints explain the target but never fill your request.</li><li>Method, URL, body, status code, and response data are validated.</li><li>Each mission keeps its own draft in this browser tab.</li><li>Only <strong>New game</strong> clears your progress and drafts.</li></ul></aside>
      </div>
    </details>

    <section className="game-workspace">
      <aside className="mission-map"><div><p>Mission map</p><h2>Your banking journey</h2></div>{missions.map((item, index) => {
        const done = game.completed.includes(item.id);
        return <button type="button" key={item.id} className={`${selected === index ? "selected" : ""} ${done ? "done" : ""}`} onClick={() => chooseMission(index)}><span>{done ? "✓" : String(index + 1).padStart(2, "0")}</span><div><small>{item.chapter}</small><b>{item.title}</b></div><i>{done ? "+100 XP" : selected === index ? "Playing" : "Open"}</i></button>;
      })}</aside>

      <form className="mission-console" onSubmit={sendRequest}>
        <div className="mission-title"><span className="game-method mystery">?</span><div><small>{mission.chapter}</small><h2>{mission.title}</h2><p>{mission.objective}</p></div><b>Expected {mission.expected}</b></div>

        <label>Build the request <span>Draft saved automatically in this browser tab</span></label>
        <div className="game-url manual-url"><select aria-label="HTTP method" value={requestMethod} onChange={(event) => setRequestMethod(event.target.value)}><option value="">METHOD</option><option>GET</option><option>POST</option><option>PUT</option><option>PATCH</option><option>DELETE</option></select><input aria-label="Challenge request URL" value={requestUrl} onChange={(event) => setRequestUrl(event.target.value)} placeholder={`${origin || "https://your-domain"}/api/v1/...`} spellCheck={false} /><button type="submit" disabled={loading || Boolean(prerequisite)}>{loading ? "Sending..." : "Send request"}</button></div>

        <section className="game-headers"><header><b>Request headers</b><span>{mission.id === "token" ? "Authentication not required" : tokenActive ? "Bearer token attached" : "Token required"}</span></header><div><code>Accept</code><span>application/json</span></div>{needsBody && <div><code>Content-Type</code><span>application/json</span></div>}{mission.id !== "token" && <div><code>Authorization</code><span>{tokenActive ? `Bearer ${game.token.slice(0, 12)}...` : "Bearer <token>"}</span></div>}</section>

        <section className="game-inventory"><header><b>Saved mission data</b><span>Use these values when writing URLs or request bodies.</span></header><div><small>Customer ID</small><code>{game.customerId || "Not earned yet"}</code></div><div><small>Salary Account ID</small><code>{game.primaryAccountId || "Not earned yet"}</code></div><div><small>Goal Account ID</small><code>{game.secondaryAccountId || "Not earned yet"}</code></div></section>

        {needsBody ? <section className="game-body"><header><b>Write the request body</b><div><button type="button" onClick={() => setShowHints((current) => !current)}>{showHints ? "Hide hints" : "Show challenge hints"}</button><button type="button" onClick={formatBody}>Format JSON</button><button type="button" onClick={clearBody}>Clear</button></div></header><div className="write-challenge"><b>Your challenge</b><span>Choose the method, enter the correct URL, and write valid JSON. All three are checked before XP is awarded.</span>{showHints && <ul><li><code>Method: {mission.method}</code></li><li><code>URL: {mission.path(game)}</code></li>{mission.hints?.map((hint) => <li key={hint}><code>{hint}</code></li>)}</ul>}</div><textarea value={body} onChange={(event) => setBody(event.target.value)} aria-label="Challenge JSON request body" placeholder="Write your JSON request body here..." spellCheck={false} /></section> : <div className="game-no-body"><b>No request body required</b><span>You must still choose the correct method and manually enter the endpoint URL.</span><button type="button" onClick={() => setShowHints((current) => !current)}>{showHints ? "Hide hints" : "Show method and URL hint"}</button>{showHints && <div><code>Method: {mission.method}</code><code>URL: {mission.path(game)}</code></div>}</div>}

        {prerequisite && <div className="game-prerequisite"><b>Mission requirement</b><span>{prerequisite}</span><button type="button" onClick={() => chooseMission(Math.max(0, nextMission))}>Go to required mission</button></div>}
      </form>

      <aside className="mission-result">
        <header><div><small>Live result</small><h2>API response</h2></div>{result && <span className={result.passed ? "passed" : "failed"}>{result.status || "Error"}</span>}</header>
        <div className={`game-message ${isComplete ? "complete" : ""}`}><span>{isComplete ? "★" : "→"}</span><p>{message}</p></div>
        {result ? <><div className="result-meta"><span>{result.elapsed} ms</span><span>application/json</span><span>{result.passed ? "Assertions PASS" : "Assertions FAIL"}</span></div><pre>{JSON.stringify(result.data, null, 2)}</pre></> : <div className="result-empty"><span>⌁</span><b>Your response appears here</b><p>Send the mission request to reveal its status code, timing, and JSON.</p></div>}
        {isComplete && <button type="button" className="continue-mission" onClick={continueGame}>{game.completed.length === missions.length ? "Review final mission" : "Continue to next mission →"}</button>}
      </aside>
    </section>

    <section className={`victory-panel ${gameComplete ? "unlocked" : ""}`}>
      <div className="victory-main"><span>★</span><div><p>Final achievement</p><h2>{gameComplete ? "Banking API Champion unlocked!" : "Complete all missions to unlock your badge"}</h2><small>{gameComplete ? "You built complete requests, generated authentication, transferred funds, and passed advanced negative-testing missions." : `${missions.length - game.completed.length} mission${missions.length - game.completed.length === 1 ? "" : "s"} remaining.`}</small></div></div><div className="victory-score"><b>{score}/{missions.length * 100} XP</b>{gameComplete && <button type="button" onClick={copyAchievement}>{achievementCopied ? "Achievement copied!" : "Copy achievement"}</button>}</div>
      {gameComplete && <div className="achievement-summary"><article><span>Missions</span><b>{game.completed.length}/{missions.length}</b></article><article><span>Attempts</span><b>{game.attempts}</b></article><article><span>Final rank</span><b>{rankFor(game.completed.length)}</b></article><article><span>Status codes practised</span><b>{practisedStatuses.join(" · ")}</b></article><p>Share your result with your learning community or save it for your portfolio.</p></div>}
    </section>

    <footer>Built by <b>Betappa Bharath</b> for hands-on API testing practice · <a href="/#playground">Return to free practice</a></footer>
  </main>;
}
