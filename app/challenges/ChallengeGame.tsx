"use client";

import { useEffect, useMemo, useState } from "react";

type MissionId = "token" | "customer" | "primary" | "secondary" | "deposit" | "transfer" | "verify";
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
  method: "GET" | "POST";
  expected: number;
  path: (state: GameState) => string;
  body?: (state: GameState) => string;
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
  },
  {
    id: "verify",
    chapter: "Final Mission",
    title: "Audit the final balance",
    objective: "Read the salary account and inspect its balance and transaction history.",
    method: "GET",
    expected: 200,
    path: (state) => `/api/v1/accounts/${state.primaryAccountId || "{accountId}"}`,
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
  if (id === "verify") return String(inner.id ?? "").startsWith("ACC-") && typeof inner.balance === "number";
  return false;
}

function rankFor(completed: number) {
  if (completed === missions.length) return "Banking API Champion";
  if (completed >= 5) return "Automation Ace";
  if (completed >= 3) return "Banking Tester";
  if (completed >= 1) return "API Explorer";
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
  const [body, setBody] = useState(missions[0].body?.(emptyGame) ?? "");
  const [origin, setOrigin] = useState("");
  const [result, setResult] = useState<ApiResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("Start with Mission 01 to create your secure practice session.");
  const [now, setNow] = useState(0);
  const [ready, setReady] = useState(false);

  const mission = missions[selected];
  const score = game.completed.length * 100;
  const progress = Math.round(game.completed.length / missions.length * 100);
  const tokenActive = Boolean(game.token) && game.expiresAt > now;
  const currentPath = mission.path(game);
  const fullUrl = `${origin}${currentPath}`;
  const needsBody = Boolean(mission.body);
  const isComplete = game.completed.includes(mission.id);
  const nextMission = missions.findIndex((item) => !game.completed.includes(item.id));

  const prerequisite = useMemo(() => {
    if (mission.id === "token") return "";
    if (!tokenActive) return "Generate an active token in Mission 01 first.";
    if (["primary", "secondary"].includes(mission.id) && !game.customerId) return "Create a customer in Mission 02 first.";
    if (["deposit", "verify"].includes(mission.id) && !game.primaryAccountId) return "Create the salary account in Mission 03 first.";
    if (mission.id === "transfer" && (!game.primaryAccountId || !game.secondaryAccountId)) return "Create both accounts before attempting the transfer.";
    return "";
  }, [mission.id, tokenActive, game.customerId, game.primaryAccountId, game.secondaryAccountId]);

  useEffect(() => {
    setOrigin(window.location.origin);
    setNow(Date.now());
    try {
      const saved = sessionStorage.getItem("bbl-challenge-game");
      if (saved) {
        const restored = { ...emptyGame, ...JSON.parse(saved) } as GameState;
        setGame(restored);
        const firstOpen = missions.findIndex((item) => !restored.completed.includes(item.id));
        const index = firstOpen < 0 ? missions.length - 1 : firstOpen;
        setSelected(index);
        setBody(missions[index].body?.(restored) ?? "");
        setMessage(restored.completed.length === missions.length ? "Challenge completed. Your champion badge is ready." : "Your challenge session has been restored.");
      }
    } catch {
      sessionStorage.removeItem("bbl-challenge-game");
    }
    setReady(true);
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (ready) sessionStorage.setItem("bbl-challenge-game", JSON.stringify(game));
  }, [game, ready]);

  function chooseMission(index: number) {
    setSelected(index);
    setBody(missions[index].body?.(game) ?? "");
    setResult(null);
    setMessage(missions[index].objective);
  }

  function resetGame() {
    setGame(emptyGame);
    setSelected(0);
    setBody(missions[0].body?.(emptyGame) ?? "");
    setResult(null);
    setMessage("New game created. Generate a token to begin.");
    sessionStorage.removeItem("bbl-challenge-game");
  }

  function resetBody() {
    setBody(mission.body?.(game) ?? "");
    setMessage("Example request body restored.");
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
    let parsedBody: unknown;
    if (needsBody) {
      try {
        parsedBody = JSON.parse(body);
      } catch {
        setMessage("Mission not sent: correct the invalid JSON request body.");
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
      const response = await fetch(currentPath, { method: mission.method, headers, body: needsBody ? JSON.stringify(parsedBody) : undefined });
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

  return <main className="challenge-game-page">
    <header className="game-nav">
      <a className="game-brand" href="/"><span>B</span><strong>BetappaBharath <em>API TestLab</em></strong></a>
      <nav><a href="/#playground">Free Practice</a><a href="/swagger">Swagger</a><a href="/guide">User Guide</a></nav>
    </header>

    <section className="game-hero">
      <div><p>Banking API Quest</p><h1>Test APIs. Complete missions. <span>Become the champion.</span></h1><small>Every mission sends a real request to your live banking API. Edit the JSON, inspect the response, earn XP, and learn by doing.</small></div>
      <div className="player-card"><div><span>Current rank</span><b>{rankFor(game.completed.length)}</b></div><div className="xp-ring" style={{ "--progress": `${progress * 3.6}deg` } as React.CSSProperties}><strong>{score}</strong><span>XP</span></div></div>
    </section>

    <section className="game-stats" aria-label="Challenge progress">
      <div><span>Progress</span><b>{game.completed.length}/{missions.length} missions</b><i><em style={{ width: `${progress}%` }} /></i></div>
      <div><span>Winning streak</span><b>{game.streak} successful request{game.streak === 1 ? "" : "s"}</b></div>
      <div><span>Attempts</span><b>{game.attempts}</b></div>
      <div><span>Session token</span><b className={tokenActive ? "game-ready" : "game-waiting"}>{tokenActive ? remainingTime(game.expiresAt - now) : "Not active"}</b></div>
      <button type="button" onClick={resetGame}>New game</button>
    </section>

    <section className="game-workspace">
      <aside className="mission-map"><div><p>Mission map</p><h2>Your banking journey</h2></div>{missions.map((item, index) => {
        const done = game.completed.includes(item.id);
        return <button type="button" key={item.id} className={`${selected === index ? "selected" : ""} ${done ? "done" : ""}`} onClick={() => chooseMission(index)}><span>{done ? "✓" : String(index + 1).padStart(2, "0")}</span><div><small>{item.chapter}</small><b>{item.title}</b></div><i>{done ? "+100 XP" : selected === index ? "Playing" : "Open"}</i></button>;
      })}</aside>

      <form className="mission-console" onSubmit={sendRequest}>
        <div className="mission-title"><span className={`game-method ${mission.method.toLowerCase()}`}>{mission.method}</span><div><small>{mission.chapter}</small><h2>{mission.title}</h2><p>{mission.objective}</p></div><b>Expected {mission.expected}</b></div>

        <label>Request URL <span>Real live endpoint</span></label>
        <div className="game-url"><code>{fullUrl || currentPath}</code><button type="submit" disabled={loading || Boolean(prerequisite)}>{loading ? "Sending..." : "Send request"}</button></div>

        <section className="game-headers"><header><b>Request headers</b><span>{mission.id === "token" ? "Authentication not required" : tokenActive ? "Bearer token attached" : "Token required"}</span></header><div><code>Accept</code><span>application/json</span></div>{needsBody && <div><code>Content-Type</code><span>application/json</span></div>}{mission.id !== "token" && <div><code>Authorization</code><span>{tokenActive ? `Bearer ${game.token.slice(0, 12)}...` : "Bearer <token>"}</span></div>}</section>

        {needsBody ? <section className="game-body"><header><b>Request body</b><div><button type="button" onClick={formatBody}>Format JSON</button><button type="button" onClick={resetBody}>Reset example</button></div></header>{mission.id === "token" && <p><code>expires_in</code> uses seconds: 900, 1800, 2700, or 3600.</p>}<textarea value={body} onChange={(event) => setBody(event.target.value)} aria-label="Challenge JSON request body" spellCheck={false} /></section> : <div className="game-no-body"><b>No request body required</b><span>This GET mission identifies the account through the URL.</span></div>}

        {prerequisite && <div className="game-prerequisite"><b>Mission requirement</b><span>{prerequisite}</span><button type="button" onClick={() => chooseMission(Math.max(0, nextMission))}>Go to required mission</button></div>}
      </form>

      <aside className="mission-result">
        <header><div><small>Live result</small><h2>API response</h2></div>{result && <span className={result.passed ? "passed" : "failed"}>{result.status || "Error"}</span>}</header>
        <div className={`game-message ${isComplete ? "complete" : ""}`}><span>{isComplete ? "★" : "→"}</span><p>{message}</p></div>
        {result ? <><div className="result-meta"><span>{result.elapsed} ms</span><span>application/json</span><span>{result.passed ? "Assertions PASS" : "Assertions FAIL"}</span></div><pre>{JSON.stringify(result.data, null, 2)}</pre></> : <div className="result-empty"><span>⌁</span><b>Your response appears here</b><p>Send the mission request to reveal its status code, timing, and JSON.</p></div>}
        {isComplete && <button type="button" className="continue-mission" onClick={continueGame}>{game.completed.length === missions.length ? "Review final mission" : "Continue to next mission →"}</button>}
      </aside>
    </section>

    <section className={`victory-panel ${game.completed.length === missions.length ? "unlocked" : ""}`}>
      <div><span>★</span><div><p>Final achievement</p><h2>{game.completed.length === missions.length ? "Banking API Champion unlocked!" : "Complete all missions to unlock your badge"}</h2><small>{game.completed.length === missions.length ? "You generated authentication, created banking data, transferred funds, and verified the result through real API requests." : `${missions.length - game.completed.length} mission${missions.length - game.completed.length === 1 ? "" : "s"} remaining.`}</small></div></div><b>{score}/700 XP</b>
    </section>

    <footer>Built by <b>Betappa Bharath</b> for hands-on API testing practice · <a href="/#playground">Return to free practice</a></footer>
  </main>;
}
