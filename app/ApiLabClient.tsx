"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import BankingFlowGuide from "./BankingFlowGuide";
import { ChallengeBoard, InspectorData, LearningToolsStyles, Mode, ModeSwitcher, NegativeKind, NegativeTestingLab, PostmanGuide, PracticeDataControls, RequestInspector } from "./LearningTools";

type Result = { status: number; elapsed: number; data: unknown; requestId?: string; contentType?: string; timestamp?: string };
type Scenario = { group: string; label: string; method: string; description: string; path: (ids: Ids) => string; body?: string; expected: string };
type Ids = { customerId: string; primaryAccountId: string; secondaryAccountId: string };
type HistoryItem = { id: number; method: string; path: string; label: string; status: number; elapsed: number };

const customerBody = `{
  "firstName": "Betappa",
  "middleName": "",
  "lastName": "Bharath",
  "dateOfBirth": "2000-07-17",
  "isMinorCustomer": false,
  "gender": "M",
  "birthCountry": "IN",
  "nationality": "IN"
}`;

const updateCustomerBody = `{
  "firstName": "Betappa",
  "middleName": "",
  "lastName": "Bharath",
  "dateOfBirth": "2000-07-17",
  "isMinorCustomer": false,
  "gender": "M",
  "birthCountry": "IN",
  "nationality": "IN"
}`;

const scenarios: Scenario[] = [
  { group: "Customers", label: "List all customers", method: "GET", description: "See every customer created in this session.", path: () => "/api/v1/customers", expected: "200 OK" },
  { group: "Customers", label: "Create customer", method: "POST", description: "Create a customer and receive a new Customer ID.", path: () => "/api/v1/customers", body: customerBody, expected: "201 Created" },
  { group: "Customers", label: "Get one customer", method: "GET", description: "Find one customer using the saved Customer ID.", path: (ids) => `/api/v1/customers/${ids.customerId || "CUST-1001"}`, expected: "200 OK / 404 Not Found" },
  { group: "Customers", label: "Replace customer details", method: "PUT", description: "Replace the complete customer profile.", path: (ids) => `/api/v1/customers/${ids.customerId || "CUST-1001"}`, body: updateCustomerBody, expected: "200 OK" },
  { group: "Customers", label: "Delete customer", method: "DELETE", description: "Delete a customer only after all active accounts are removed.", path: (ids) => `/api/v1/customers/${ids.customerId || "CUST-1001"}`, expected: "204 No Content / 409 Conflict" },
  { group: "Accounts", label: "Create savings account", method: "POST", description: "Open the first account for the saved customer.", path: (ids) => `/api/v1/customers/${ids.customerId || "CUST-1001"}/accounts`, body: '{\n  "accountType": "savings",\n  "nickname": "Salary Account",\n  "openingBalance": 10000\n}', expected: "201 Created" },
  { group: "Accounts", label: "Create second account", method: "POST", description: "Open another account for the same customer.", path: (ids) => `/api/v1/customers/${ids.customerId || "CUST-1001"}/accounts`, body: '{\n  "accountType": "savings",\n  "nickname": "Travel Fund",\n  "openingBalance": 0\n}', expected: "201 Created" },
  { group: "Accounts", label: "List customer accounts", method: "GET", description: "See all accounts owned by one customer.", path: (ids) => `/api/v1/customers/${ids.customerId || "CUST-1001"}/accounts`, expected: "200 OK" },
  { group: "Accounts", label: "Get account details", method: "GET", description: "See balance, account details, and transactions.", path: (ids) => `/api/v1/accounts/${ids.primaryAccountId || "ACC-5001"}`, expected: "200 OK / 404 Not Found" },
  { group: "Accounts", label: "Rename account", method: "PATCH", description: "Change only the account nickname.", path: (ids) => `/api/v1/accounts/${ids.secondaryAccountId || "ACC-5002"}`, body: '{\n  "nickname": "Emergency Fund"\n}', expected: "200 OK" },
  { group: "Accounts", label: "Delete account", method: "DELETE", description: "Delete an account only when its balance is zero.", path: (ids) => `/api/v1/accounts/${ids.secondaryAccountId || "ACC-5002"}`, expected: "204 No Content / 409 Conflict" },
  { group: "Money", label: "Deposit money", method: "POST", description: "Credit money into the primary account.", path: (ids) => `/api/v1/accounts/${ids.primaryAccountId || "ACC-5001"}/transactions`, body: '{\n  "type": "credit",\n  "amount": 2500,\n  "reference": "Salary credit"\n}', expected: "201 Created" },
  { group: "Money", label: "Withdraw money", method: "POST", description: "Debit money from an account with enough balance.", path: (ids) => `/api/v1/accounts/${ids.secondaryAccountId || "ACC-5002"}/transactions`, body: '{\n  "type": "debit",\n  "amount": 1500,\n  "reference": "Cash withdrawal"\n}', expected: "201 Created / 422 Insufficient Funds" },
  { group: "Money", label: "Transfer money", method: "POST", description: "Move money from the primary account to the second account.", path: () => "/api/v1/transfers", body: "TRANSFER_BODY", expected: "201 Created / 422 Insufficient Funds" },
  { group: "Money", label: "View transactions", method: "GET", description: "See the transaction history for an account.", path: (ids) => `/api/v1/accounts/${ids.primaryAccountId || "ACC-5001"}/transactions`, expected: "200 OK" },
];

const methodHelp: Record<string, string> = { GET: "Read data", POST: "Create data", PUT: "Replace all data", PATCH: "Change part of data", DELETE: "Remove data" };

function assertionField(index: number) {
  if ([1, 5, 6, 11, 12].includes(index)) return "data.id";
  if ([0, 7, 14].includes(index)) return "data";
  if ([2, 3, 8, 9].includes(index)) return "data.id";
  if (index === 13) return "data.reference";
  return "";
}

function hasJsonPath(value: unknown, path: string) {
  if (!path.trim()) return true;
  return path.split(".").reduce<unknown>((current, key) => current && typeof current === "object" && key in current ? (current as Record<string, unknown>)[key] : undefined, value) !== undefined;
}

export default function ApiLabClient() {
  const [token, setToken] = useState("");
  const [creatingToken, setCreatingToken] = useState(false);
  const [ids, setIds] = useState<Ids>({ customerId: "", primaryAccountId: "", secondaryAccountId: "" });
  const [selected, setSelected] = useState(1);
  const [path, setPath] = useState("http://localhost:3000/api/v1/customers");
  const [body, setBody] = useState(customerBody);
  const [bodyError, setBodyError] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState("");
  const [baseUrl, setBaseUrl] = useState("http://localhost:3000");
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [expectedStatus, setExpectedStatus] = useState("201");
  const [expectedField, setExpectedField] = useState("data.id");
  const [mode, setMode] = useState<Mode>("beginner");
  const [inspector, setInspector] = useState<InspectorData | null>(null);
  const [negativeRunning, setNegativeRunning] = useState("");
  const [dataAction, setDataAction] = useState("");
  const [completedChallenges, setCompletedChallenges] = useState<string[]>([]);

  useEffect(() => {
    const origin = window.location.origin;
    setBaseUrl(origin);
    setPath((current) => current.replace("http://localhost:3000", origin));
    setMode(localStorage.getItem("bbl-mode") === "free" ? "free" : "beginner");
    try { setCompletedChallenges(JSON.parse(localStorage.getItem("bbl-challenges") ?? "[]")); } catch { setCompletedChallenges([]); }
  }, []);
  const scenario = scenarios[selected];
  const transferBody = useMemo(() => JSON.stringify({ fromAccountId: ids.primaryAccountId || "ACC-5001", toAccountId: ids.secondaryAccountId || "ACC-5002", amount: 1500 }, null, 2), [ids]);
  const displayUrl = path.startsWith("http") ? path : `${baseUrl}${path}`;
  const needsBody = ["POST", "PUT", "PATCH"].includes(scenario.method);
  const successfulRequests = history.filter((item) => item.status >= 200 && item.status < 300).length;
  const assertionResults = result ? [
    { label: `Status is ${expectedStatus}`, pass: result.status === Number(expectedStatus) },
    { label: "Response time is below 1000 ms", pass: result.elapsed < 1000 },
    ...(expectedField.trim() ? [{ label: `JSON contains ${expectedField}`, pass: hasJsonPath(result.data, expectedField) }] : []),
  ] : [];

  useEffect(() => {
    const newlyCompleted = [
      ...(ids.customerId ? ["customer"] : []),
      ...(ids.primaryAccountId && ids.secondaryAccountId ? ["accounts"] : []),
      ...(history.some((item) => item.label === "Transfer money" && item.status === 201) ? ["transfer"] : []),
      ...(result && assertionResults.length > 0 && assertionResults.every((item) => item.pass) ? ["assertion"] : []),
      ...(history.some((item) => item.status >= 400 && item.status < 500) ? ["negative"] : []),
    ];
    if (!newlyCompleted.some((id) => !completedChallenges.includes(id))) return;
    setCompletedChallenges((current) => { const next = Array.from(new Set([...current, ...newlyCompleted])); localStorage.setItem("bbl-challenges", JSON.stringify(next)); return next; });
  }, [ids, history, result]);

  function changeMode(next: Mode) { setMode(next); localStorage.setItem("bbl-mode", next); }

  function choose(index: number) {
    const next = scenarios[index];
    setSelected(index);
    setPath(`${baseUrl}${next.path(ids)}`);
    setBody(next.body === "TRANSFER_BODY" ? transferBody : next.body ?? "");
    setBodyError("");
    setExpectedStatus(next.expected.match(/\d{3}/)?.[0] ?? "200");
    setExpectedField(assertionField(index));
    setResult(null);
  }

  function updateId(key: keyof Ids, value: string) {
    const nextIds = { ...ids, [key]: value };
    setIds(nextIds);
    setPath(`${baseUrl}${scenario.path(nextIds)}`);
    if (scenario.body === "TRANSFER_BODY") setBody(JSON.stringify({ fromAccountId: nextIds.primaryAccountId || "ACC-5001", toAccountId: nextIds.secondaryAccountId || "ACC-5002", amount: 1500 }, null, 2));
  }

  async function createToken() {
    setCreatingToken(true);
    try {
      const response = await fetch("/api/v1/auth/token", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: "learner@example.test", password: "practice-password" }) });
      const data = await response.json();
      if (response.ok) { setToken(data.access_token); return data.access_token as string; }
      setResult({ status: response.status, elapsed: 0, data });
    } catch { setResult({ status: 0, elapsed: 0, data: { error: "The practice server could not create a token." } }); }
    finally { setCreatingToken(false); }
  }

  async function sendRequest(event: FormEvent) {
    event.preventDefault();
    if (needsBody && body.trim()) {
      try {
        JSON.parse(body);
        setBodyError("");
      } catch (error) {
        const detail = error instanceof Error ? error.message : "Check commas, quotes, and closing braces.";
        setBodyError(`This JSON is not valid: ${detail}`);
        setResult({ status: 0, elapsed: 0, data: { error: "Request not sent", message: "Fix the highlighted JSON body, or click Reset example." } });
        return;
      }
    }
    setLoading(true);
    const started = performance.now();
    try {
      const requestId = `req_${crypto.randomUUID().slice(0, 8)}`;
      const requestHeaders = { "Content-Type": "application/json", Accept: "application/json", Authorization: `Bearer ${token}`, "X-Request-ID": requestId };
      const requestBody = needsBody && body.trim() ? body : undefined;
      const response = await fetch(path, { method: scenario.method, headers: requestHeaders, body: requestBody });
      const data = response.status === 204 ? null : await response.json();
      if (response.ok && data && typeof data === "object" && "data" in data && data.data && typeof data.data === "object" && "id" in data.data) {
        const newId = String(data.data.id);
        if (selected === 1) setIds((current) => ({ ...current, customerId: newId }));
        if (selected === 5) setIds((current) => ({ ...current, primaryAccountId: newId }));
        if (selected === 6) setIds((current) => ({ ...current, secondaryAccountId: newId }));
      }
      setResult({ status: response.status, elapsed: Math.round(performance.now() - started), data: data ?? { message: "Success. A 204 response intentionally has no body." }, requestId, contentType: response.headers.get("content-type") ?? "application/json", timestamp: new Date().toLocaleTimeString() });
      setInspector({ method: scenario.method, url: path, requestHeaders, requestBody, responseHeaders: Object.fromEntries(response.headers.entries()) });
      setHistory((current) => [{ id: Date.now(), method: scenario.method, path, label: scenario.label, status: response.status, elapsed: Math.round(performance.now() - started) }, ...current].slice(0, 8));
    } catch { setResult({ status: 0, elapsed: 0, data: { error: "Request could not be sent. Check the URL and JSON body." } }); }
    finally { setLoading(false); }
  }

  async function ensureToken() { return token || await createToken() || ""; }

  async function managePracticeData(action: "reset" | "load-sample") {
    setDataAction(action);
    try {
      const accessToken = await ensureToken();
      if (!accessToken) return;
      const response = await fetch("/api/v1/practice", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` }, body: JSON.stringify({ action }) });
      const data = await response.json();
      setResult({ status: response.status, elapsed: 0, data });
      if (response.ok && action === "reset") { setIds({ customerId: "", primaryAccountId: "", secondaryAccountId: "" }); setHistory([]); setInspector(null); }
      if (response.ok && action === "load-sample") {
        const sample = data.data;
        const nextIds = { customerId: sample.customer.id, primaryAccountId: sample.primaryAccount.id, secondaryAccountId: sample.secondaryAccount.id };
        setIds(nextIds); setPath(`${baseUrl}${scenario.path(nextIds)}`);
      }
    } finally { setDataAction(""); }
  }

  async function runNegativeTest(kind: NegativeKind) {
    setNegativeRunning(kind);
    const started = performance.now();
    try {
      let accessToken = token;
      if (kind !== "401") accessToken = await ensureToken();
      const primary = ids.primaryAccountId || "ACC-5001";
      const cases = {
        "401": { method: "GET", url: `${baseUrl}/api/v1/customers`, body: undefined, token: "", label: "Missing token" },
        "404": { method: "GET", url: `${baseUrl}/api/v1/customers/CUST-999999`, body: undefined, token: accessToken, label: "Unknown customer" },
        "400": { method: "POST", url: `${baseUrl}/api/v1/customers`, body: JSON.stringify({ firstName: "Betappa" }, null, 2), token: accessToken, label: "Missing required fields" },
        "409": { method: "DELETE", url: `${baseUrl}/api/v1/accounts/${primary}`, body: undefined, token: accessToken, label: "Delete funded account" },
        "422": { method: "POST", url: `${baseUrl}/api/v1/accounts/${primary}/transactions`, body: JSON.stringify({ type: "debit", amount: 999999, reference: "Negative test" }, null, 2), token: accessToken, label: "Insufficient funds" },
      }[kind];
      const requestId = `req_${crypto.randomUUID().slice(0, 8)}`;
      const requestHeaders: Record<string, string> = { "Content-Type": "application/json", Accept: "application/json", "X-Request-ID": requestId };
      if (cases.token) requestHeaders.Authorization = `Bearer ${cases.token}`;
      const response = await fetch(cases.url, { method: cases.method, headers: requestHeaders, body: cases.body });
      const data = response.status === 204 ? null : await response.json();
      const elapsed = Math.round(performance.now() - started);
      setResult({ status: response.status, elapsed, data: data ?? { message: "No response body" }, requestId });
      setInspector({ method: cases.method, url: cases.url, requestHeaders, requestBody: cases.body, responseHeaders: Object.fromEntries(response.headers.entries()) });
      setExpectedStatus(kind); setExpectedField("error");
      setHistory((current) => [{ id: Date.now(), method: cases.method, path: cases.url, label: cases.label, status: response.status, elapsed }, ...current].slice(0, 8));
      document.getElementById("playground")?.scrollIntoView({ behavior: "smooth" });
    } finally { setNegativeRunning(""); }
  }

  function copyCurl() {
    if (!inspector) return;
    const headers = Object.entries(inspector.requestHeaders).map(([key, value]) => `-H "${key}: ${value}"`).join(" ");
    const payload = inspector.requestBody ? ` --data-raw '${inspector.requestBody.replaceAll("'", "'\\''")}'` : "";
    copyText(`curl --request ${inspector.method} "${inspector.url}" ${headers}${payload}`, "cURL copied");
  }

  async function copyText(value: string, label: string) {
    try {
      if (navigator.clipboard && window.isSecureContext) await navigator.clipboard.writeText(value);
      else { const helper = document.createElement("textarea"); helper.value = value; helper.style.position = "fixed"; helper.style.opacity = "0"; document.body.appendChild(helper); helper.select(); document.execCommand("copy"); helper.remove(); }
      setCopied(label); window.setTimeout(() => setCopied(""), 1800);
    } catch { setCopied("Copy failed"); }
  }

  return <main className={`mode-${mode}`}><LearningToolsStyles /><a className="feedback-fab" href="/feedback">Feedback</a>
    <section className="hero"><nav><span className="brand-mark">B</span><strong>BetappaBharath <em>Banking API TestLab</em></strong><a href="/swagger">Swagger</a><a href="/postman-collection.json" download="BetappaBharath-Banking-API.postman_collection.json">Postman Collection</a><a href="#playground">Practice</a></nav><div className="hero-grid"><div><p className="eyebrow">API testing made simple</p><h1>Learn by sending <span>real banking requests.</span></h1><p className="hero-copy">No setup and no risk. Create a practice token, choose an action, send the request, and understand the response.</p><div className="hero-actions"><a className="primary" href="#playground">Start practising</a><a className="secondary" href="/swagger">View API reference</a><a className="secondary download-collection" href="/postman-collection.json" download="BetappaBharath-Banking-API.postman_collection.json">↓ Download Postman</a></div></div><div className="code-card"><div className="code-top"><span>GET</span><span>/api/v1/customers</span><i>200 OK</i></div><pre>{'{\n  "data": [\n    { "id": "CUST-1001", "firstName": "Betappa" }\n  ]\n}'}</pre><p>Request in → response out</p></div></div></section>
    <section className="beginner-section"><div className="section-heading"><p className="eyebrow">Start here</p><h2>API testing in three clicks</h2></div><div className="beginner-steps"><article><span>1</span><h3>Create token</h3><p>Get a temporary access pass for the practice bank.</p></article><article><span>2</span><h3>Choose an action</h3><p>Select Create Customer, Get Account, Transfer Money, or another operation.</p></article><article><span>3</span><h3>Send request</h3><p>Read the status code and JSON response on the right.</p></article></div><div className="method-cheatsheet"><b>HTTP methods:</b>{Object.entries(methodHelp).map(([key, value]) => <span key={key}><strong>{key}</strong>{value}</span>)}</div></section>
    <ModeSwitcher mode={mode} onChange={changeMode} />
    <BankingFlowGuide />
    <PracticeDataControls busy={dataAction} onLoad={() => managePracticeData("load-sample")} onReset={() => managePracticeData("reset")} />
    <NegativeTestingLab running={negativeRunning} onRun={runNegativeTest} />
    <RequestInspector data={inspector} onCopyCurl={copyCurl} copied={copied === "cURL copied"} />
    <ChallengeBoard completed={completedChallenges} onReset={() => { setCompletedChallenges([]); localStorage.removeItem("bbl-challenges"); }} />
    <PostmanGuide />
    <section id="assertions" className="assertion-lab"><div className="section-heading"><p className="eyebrow">Assertion practice</p><h2>Check the API response automatically</h2><p>An assertion asks: “Did the API return what I expected?” Send a request below, then return here to see PASS or FAIL.</p></div><div className="assertion-workspace"><div className="assertion-inputs"><label>Expected status code<span>Example: 200 or 201</span><input type="number" value={expectedStatus} onChange={(e) => setExpectedStatus(e.target.value)} /></label><label>Expected JSON field<span>Use dots for nested fields</span><input value={expectedField} onChange={(e) => setExpectedField(e.target.value)} placeholder="Example: data.id" /></label></div><div className="assertion-results">{result ? assertionResults.map((item) => <div className={item.pass ? "assert-pass" : "assert-fail"} key={item.label}><span>{item.pass ? "PASS" : "FAIL"}</span><p>{item.label}</p></div>) : <div className="assertion-empty"><b>No response yet</b><p>Send a request in the playground to run the assertions.</p></div>}</div><div className="assertion-help"><b>Examples</b><p><code>data.id</code> checks for a created ID. <code>data</code> checks that response data exists. Response time is automatically checked against 1000 ms.</p></div></div></section>
    <section className="session-dashboard"><div className="dashboard-heading"><div><p className="eyebrow">Your practice dashboard</p><h2>Session progress</h2><p>Updates as you test APIs. It resets when the page is refreshed.</p></div><a href="#playground">Continue practising →</a></div><div className="dashboard-stats"><article><span>Requests sent</span><b>{history.length}</b></article><article><span>Successful</span><b>{successfulRequests}</b></article><article><span>Success rate</span><b>{history.length ? Math.round(successfulRequests / history.length * 100) : 0}%</b></article><article><span>Token</span><b className={token ? "ready-text" : "waiting-text"}>{token ? "Ready" : "Not created"}</b></article></div><div className="dashboard-details"><section><h3>Saved practice IDs</h3><div className="saved-data"><div><span>Customer ID</span><code>{ids.customerId || "Not created yet"}</code></div><div><span>Primary Account</span><code>{ids.primaryAccountId || "Not created yet"}</code></div><div><span>Second Account</span><code>{ids.secondaryAccountId || "Not created yet"}</code></div></div></section><section><h3>Recent requests</h3>{history.length ? <div className="history-list">{history.slice(0, 4).map((item) => <div key={item.id}><span className={`mini-method ${item.method.toLowerCase()}`}>{item.method}</span><p><b>{item.label}</b><small>{item.path}</small></p><strong className={item.status >= 200 && item.status < 300 ? "history-good" : "history-bad"}>{item.status}</strong><small>{item.elapsed} ms</small></div>)}</div> : <p className="dashboard-empty">Your latest API requests will appear here.</p>}</section></div></section>
    <section id="playground" className="playground-section"><div className="section-heading"><p className="eyebrow">Practice area</p><h2>Choose, edit, and send</h2><p>Every operation is available. The examples are safe to change.</p></div><div className="practice-toolbar"><section><b>1. Access token</b><span>{token ? "Ready" : "Required before sending"}</span><button type="button" onClick={createToken} disabled={creatingToken}>{creatingToken ? "Creating…" : token ? "Create new token" : "Create token"}</button>{token && <button type="button" className="quiet" onClick={() => copyText(token, "Token copied")}>{copied === "Token copied" ? "Copied!" : "Copy token"}</button>}</section><section><b>2. Saved IDs</b><span>Automatically filled after creation</span><div className="id-fields"><input aria-label="Customer ID" placeholder="Customer ID" value={ids.customerId} onChange={(e) => updateId("customerId", e.target.value)} /><input aria-label="Primary Account ID" placeholder="Account ID 1" value={ids.primaryAccountId} onChange={(e) => updateId("primaryAccountId", e.target.value)} /><input aria-label="Secondary Account ID" placeholder="Account ID 2" value={ids.secondaryAccountId} onChange={(e) => updateId("secondaryAccountId", e.target.value)} /></div></section></div><div className="lab-grid"><aside className="presets"><h3>3. Choose an operation</h3>{["Customers", "Accounts", "Money"].map((group) => <div className="operation-group" key={group}><h4>{group}</h4>{scenarios.map((item, index) => item.group === group && <button key={item.label} type="button" className={index === selected ? "current" : ""} onClick={() => choose(index)}><span className={`pill ${item.method.toLowerCase()}`}>{item.method}</span><b>{item.label}</b><small>{item.description}</small></button>)}</div>)}</aside><form className="request-panel" onSubmit={sendRequest}><div className="selected-summary"><span className={`method-badge ${scenario.method.toLowerCase()}`}>{scenario.method}</span><div><h3>{scenario.label}</h3><p>{scenario.description}</p></div><b>Expected: {scenario.expected}</b></div><label>Request URL <span>Live API endpoint</span></label><div className="request-line"><input value={path} onChange={(e) => setPath(e.target.value)} aria-label="API path" title={path} /><button className="send" disabled={loading || !token}>{loading ? "Sending…" : "Send"}</button></div><code className="full-request-url">{path}</code>{!token && <p className="inline-help">Create a token above to enable Send.</p>}<details className="headers-panel"><summary>Headers <span>{token ? "Authorization token attached" : "Token missing"}</span></summary><div className="header-row"><code>Content-Type</code><span>application/json</span></div><div className="header-row auth-row"><code>Authorization</code><div><span>Bearer</span><input value={token} onChange={(e) => setToken(e.target.value)} aria-label="Bearer token" /></div></div></details>{needsBody ? <><label>Request body <span>JSON sent to the API</span></label><div className="body-tools"><button type="button" onClick={() => { try { setBody(JSON.stringify(JSON.parse(body), null, 2)); setBodyError(""); } catch { setBodyError("This JSON is not valid. Click Reset example to restore it."); } }}>Format JSON</button><button type="button" onClick={() => { setBody(scenario.body === "TRANSFER_BODY" ? transferBody : scenario.body ?? ""); setBodyError(""); }}>Reset example</button></div><textarea className={bodyError ? "json-invalid" : ""} value={body} onChange={(e) => { setBody(e.target.value); setBodyError(""); }} aria-label="JSON request body" aria-invalid={Boolean(bodyError)} />{bodyError && <p className="json-error" role="alert">{bodyError}</p>}</> : <div className="no-body"><b>No request body needed</b><span>{scenario.method} requests use the URL to identify the data.</span></div>}<div className="postman"><div><b>Postman URL</b><code>{displayUrl}</code></div><button type="button" onClick={() => copyText(displayUrl, "URL copied")}>{copied === "URL copied" ? "Copied!" : "Copy URL"}</button></div></form><section className="response-panel"><div className="response-head"><div><h3>4. Response</h3><p>{result ? (result.status >= 200 && result.status < 300 ? "The request succeeded." : result.status === 0 ? "The request was not sent. Fix the input shown on the left." : "The API rejected the request. Read the message below.") : "Send a request to see the result."}</p></div>{result && <span className={result.status >= 200 && result.status < 300 ? "status good" : "status bad"}>{result.status || "Input"}</span>}</div>{result ? <><small>{result.elapsed} ms · application/json</small><pre>{JSON.stringify(result.data, null, 2)}</pre></> : <div className="empty-state"><span>→</span><p>Response appears here</p><small>Status code, time, and returned data will be shown.</small></div>}</section></div></section>
    <section className="status-section"><div className="section-heading"><p className="eyebrow">Status code guide</p><h2>Understand the API&apos;s answer</h2></div><div className="status-grid">{[["200","OK","Data was read or updated successfully."],["201","Created","A customer, account, or transaction was created."],["204","No Content","Deletion succeeded. An empty response body is correct."],["400","Bad Request","The JSON is invalid or a required field is missing."],["401","Unauthorized","The token is missing, invalid, or expired."],["404","Not Found","The customer or account ID does not exist."],["409","Conflict","A banking rule prevents the action."],["422","Cannot Process","The request is valid, but funds are insufficient."]].map(([code,title,copy]) => <article className={code.startsWith("2") ? "success" : "client-error"} key={code}><b>{code}</b><div><h3>{title}</h3><p>{copy}</p></div></article>)}</div></section><footer>Built by <b>Betappa Bharath</b> for the QA community · <a href="https://www.linkedin.com/in/betappa-bharathb111/" target="_blank" rel="noopener noreferrer">Connect on LinkedIn ↗</a> · Practice data only</footer>
  </main>;
}
