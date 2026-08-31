"use client";

import { useState } from "react";

type DefectResult = { status: number | string; elapsed: number; data: unknown; headers: Record<string, string> };
type DataRow = Record<string, string>;
type RowResult = { row: number; name: string; expected: number; actual: number; passed: boolean; message: string; elapsed: number };

const defects = [
  { id: "baseline", label: "Healthy response", expected: "200", help: "Start with the normal API behaviour." },
  { id: "slow-response", label: "Slow response", expected: "200 · slow", help: "Verify performance thresholds." },
  { id: "timeout", label: "Client timeout", expected: "Timeout", help: "Practise AbortController and retry handling." },
  { id: "server-error", label: "Server failure", expected: "500", help: "Check safe error handling and request IDs." },
  { id: "rate-limit", label: "Rate limited", expected: "429", help: "Read Retry-After before retrying." },
  { id: "expired-token", label: "Expired token", expected: "401", help: "Refresh authentication before retrying." },
  { id: "missing-field", label: "Missing response field", expected: "200 · bad contract", help: "Catch schema and JSONPath failures." },
  { id: "malformed-json", label: "Malformed JSON", expected: "Parse error", help: "Handle an unreadable response body." },
  { id: "flaky-service", label: "Flaky service", expected: "503 / 200", help: "Odd attempts fail; even attempts pass." },
  { id: "duplicate-request", label: "Duplicate request", expected: "409", help: "Understand idempotency protection." },
];

const sampleCsv = `firstName,lastName,dateOfBirth,gender,birthCountry,nationality,expectedStatus
Aarav,Sharma,1992-04-12,M,IN,IN,201
Priya,Rao,1995-09-20,F,IN,IN,201
,MissingName,2000-01-01,M,IN,IN,400
Nikhil,Iyer,1988-11-08,M,IN,IN,201`;

function parseCsv(value: string): DataRow[] {
  const lines = value.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) throw new Error("CSV needs a header and at least one data row.");
  const headers = lines[0].split(",").map((item) => item.trim());
  return lines.slice(1).map((line) => Object.fromEntries(headers.map((header, index) => [header, line.split(",")[index]?.trim() ?? ""])));
}

function parseDataset(value: string, format: "csv" | "json") {
  if (format === "csv") return parseCsv(value);
  const parsed = JSON.parse(value) as unknown;
  if (!Array.isArray(parsed)) throw new Error("JSON data must be an array of objects.");
  return parsed.map((row) => Object.fromEntries(Object.entries(row as Record<string, unknown>).map(([key, item]) => [key, String(item ?? "")]))) as DataRow[];
}

export default function SdetLabClient() {
  const [token, setToken] = useState("");
  const [tokenMessage, setTokenMessage] = useState("Create a temporary session before running tests.");
  const [defect, setDefect] = useState("baseline");
  const [defectAttempt, setDefectAttempt] = useState(0);
  const [defectLoading, setDefectLoading] = useState(false);
  const [defectResult, setDefectResult] = useState<DefectResult | null>(null);
  const [format, setFormat] = useState<"csv" | "json">("csv");
  const [dataset, setDataset] = useState(sampleCsv);
  const [dataMessage, setDataMessage] = useState("Edit the sample or upload your own CSV/JSON file. Maximum 20 rows.");
  const [rowResults, setRowResults] = useState<RowResult[]>([]);
  const [dataLoading, setDataLoading] = useState(false);

  async function createToken() {
    const response = await fetch("/api/v1/auth/token", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: "sdet-learner@example.test", password: "practice-password", expires_in: 900 }) });
    const data = await response.json();
    if (response.ok) { setToken(data.access_token); setTokenMessage("Practice token active for 15 minutes."); }
    else setTokenMessage(data.message ?? "Token creation failed.");
  }

  async function runDefect() {
    if (!token && defect !== "expired-token") { setTokenMessage("Create a token first."); return; }
    setDefectLoading(true);
    const nextAttempt = defectAttempt + 1;
    setDefectAttempt(nextAttempt);
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 2200);
    const started = performance.now();
    try {
      const response = await fetch("/api/v1/simulator", { method: "POST", signal: controller.signal, headers: { "Content-Type": "application/json", Authorization: `Bearer ${defect === "expired-token" ? "expired-demo-token" : token}` }, body: JSON.stringify({ defect, attempt: nextAttempt }) });
      const raw = await response.text();
      let data: unknown;
      try { data = raw ? JSON.parse(raw) : null; }
      catch { data = { parseError: "Response body is not valid JSON", rawResponse: raw }; }
      setDefectResult({ status: response.status, elapsed: Math.round(performance.now() - started), data, headers: Object.fromEntries(response.headers.entries()) });
    } catch (error) {
      setDefectResult({ status: error instanceof DOMException && error.name === "AbortError" ? "TIMEOUT" : "NETWORK ERROR", elapsed: Math.round(performance.now() - started), data: { error: "The client stopped waiting for the response.", lesson: "Set a timeout, log the failure, and retry only when the operation is safe." }, headers: {} });
    } finally { window.clearTimeout(timeout); setDefectLoading(false); }
  }

  async function readFile(file?: File) {
    if (!file) return;
    const nextFormat = file.name.toLowerCase().endsWith(".json") ? "json" : "csv";
    setFormat(nextFormat);
    setDataset(await file.text());
    setDataMessage(`${file.name} loaded. Review the data before running.`);
  }

  async function runDataset() {
    if (!token) { setTokenMessage("Create a token first."); return; }
    let rows: DataRow[];
    try { rows = parseDataset(dataset, format); }
    catch (error) { setDataMessage(error instanceof Error ? error.message : "The dataset could not be read."); return; }
    if (!rows.length || rows.length > 20) { setDataMessage("Use between 1 and 20 data rows."); return; }
    setDataLoading(true); setRowResults([]); setDataMessage(`Running ${rows.length} API test rows...`);
    const results: RowResult[] = [];
    try {
      for (let index = 0; index < rows.length; index++) {
        const row = rows[index];
        const expected = Number(row.expectedStatus || 201);
        const body = { firstName: row.firstName, middleName: row.middleName ?? "", lastName: row.lastName, dateOfBirth: row.dateOfBirth, isMinorCustomer: row.isMinorCustomer === "true", gender: row.gender, birthCountry: row.birthCountry || "IN", nationality: row.nationality || "IN" };
        const started = performance.now();
        try {
          const response = await fetch("/api/v1/customers", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(body) });
          const responseBody = await response.json() as Record<string, unknown>;
          results.push({ row: index + 1, name: `${row.firstName || "(blank)"} ${row.lastName || ""}`.trim(), expected, actual: response.status, passed: response.status === expected, message: String(responseBody.message ?? (response.ok ? "Customer created" : responseBody.error ?? "Request failed")), elapsed: Math.round(performance.now() - started) });
        } catch {
          results.push({ row: index + 1, name: `${row.firstName || "(blank)"} ${row.lastName || ""}`.trim(), expected, actual: 0, passed: false, message: "Network request failed", elapsed: Math.round(performance.now() - started) });
        }
        setRowResults([...results]);
      }
      setDataMessage(`${results.filter((item) => item.passed).length}/${results.length} rows passed.`);
    } finally { setDataLoading(false); }
  }

  function loadSample(nextFormat: "csv" | "json") {
    setFormat(nextFormat);
    setDataset(nextFormat === "csv" ? sampleCsv : JSON.stringify(parseCsv(sampleCsv), null, 2));
    setRowResults([]);
    setDataMessage(`Sample ${nextFormat.toUpperCase()} loaded.`);
  }

  function downloadReport() {
    const report = { generatedAt: new Date().toISOString(), summary: { total: rowResults.length, passed: rowResults.filter((item) => item.passed).length, failed: rowResults.filter((item) => !item.passed).length }, results: rowResults };
    const url = URL.createObjectURL(new Blob([JSON.stringify(report, null, 2)], { type: "application/json" }));
    const link = document.createElement("a"); link.href = url; link.download = "data-driven-api-report.json"; link.click(); URL.revokeObjectURL(url);
  }

  const selectedDefect = defects.find((item) => item.id === defect) ?? defects[0];
  const passedRows = rowResults.filter((item) => item.passed).length;

  return <main className="sdet-lab-page">
    <header className="tool-nav"><a href="/"><span>B</span><strong>BetappaBharath <em>API TestLab</em></strong></a><nav><a href="/interview-prep">Interview Prep</a><a href="/demo">2-Min Demo</a><a href="/#playground">API Practice</a></nav></header>
    <section className="sdet-hero"><div><p>Advanced SDET workspace</p><h1>Test failures. Run datasets. Build production instincts.</h1><span>Two focused labs for learning resilient API automation without affecting a real banking system.</span></div><aside><b>Session access</b><p>{tokenMessage}</p><button type="button" onClick={createToken}>{token ? "Create fresh token" : "Create practice token"}</button></aside></section>

    <section className="defect-lab"><div className="tool-section-heading"><p>Lab 01</p><h2>API defect simulator</h2><span>Choose a controlled failure, send the request, and learn what a robust test should verify.</span></div><div className="defect-layout"><aside>{defects.map((item) => <button type="button" key={item.id} className={defect === item.id ? "active" : ""} onClick={() => { setDefect(item.id); setDefectResult(null); }}><b>{item.label}</b><span>{item.expected}</span><small>{item.help}</small></button>)}</aside><section className="defect-console"><header><div><span>POST</span><code>/api/v1/simulator</code></div><button type="button" onClick={runDefect} disabled={defectLoading}>{defectLoading ? "Sending..." : "Run simulation"}</button></header><div className="defect-request"><b>Request body</b><pre>{JSON.stringify({ defect: selectedDefect.id, attempt: defectAttempt + 1 }, null, 2)}</pre></div>{defectResult ? <><div className="defect-meta"><b>{defectResult.status}</b><span>{defectResult.elapsed} ms</span><span>{Object.keys(defectResult.headers).length} response headers</span></div><pre className="defect-response">{JSON.stringify(defectResult.data, null, 2)}</pre><details><summary>Response headers and tester guidance</summary><pre>{JSON.stringify(defectResult.headers, null, 2)}</pre><p><b>What to test:</b> {selectedDefect.help} Assert the expected status or client behaviour, log useful diagnostics, and never retry unsafe operations blindly.</p></details></> : <div className="defect-empty"><span>→</span><b>Run the selected simulation</b><p>The actual status, timing, body, and headers will appear here.</p></div>}</section></div></section>

    <section className="data-lab"><div className="tool-section-heading"><p>Lab 02</p><h2>Data-driven API testing</h2><span>Run one customer API test against many CSV or JSON rows and compare expected versus actual status codes.</span></div><div className="data-controls"><div><button type="button" className={format === "csv" ? "active" : ""} onClick={() => loadSample("csv")}>CSV sample</button><button type="button" className={format === "json" ? "active" : ""} onClick={() => loadSample("json")}>JSON sample</button><label>Upload file<input type="file" accept=".csv,.json,text/csv,application/json" onChange={(event) => readFile(event.target.files?.[0])} /></label></div><span>{dataMessage}</span></div><textarea value={dataset} onChange={(event) => setDataset(event.target.value)} aria-label="Data-driven test dataset" spellCheck={false} /><div className="data-actions"><button type="button" onClick={runDataset} disabled={dataLoading}>{dataLoading ? "Running rows..." : "Run data tests"}</button>{rowResults.length > 0 && <button type="button" className="secondary-action" onClick={downloadReport}>Download JSON report</button>}</div>{rowResults.length > 0 && <div className="data-results"><header><div><span>Total</span><b>{rowResults.length}</b></div><div><span>Passed</span><b>{passedRows}</b></div><div><span>Failed</span><b>{rowResults.length - passedRows}</b></div><div><span>Pass rate</span><b>{Math.round(passedRows / rowResults.length * 100)}%</b></div></header><div className="result-table"><div><b>Row</b><b>Test data</b><b>Expected</b><b>Actual</b><b>Result</b><b>Time</b></div>{rowResults.map((item) => <div key={item.row}><span>{item.row}</span><span><b>{item.name}</b><small>{item.message}</small></span><code>{item.expected}</code><code>{item.actual}</code><strong className={item.passed ? "pass" : "fail"}>{item.passed ? "PASS" : "FAIL"}</strong><span>{item.elapsed} ms</span></div>)}</div></div>}</section>
    <footer>Practice data only · Maximum 20 rows per run · <a href="/guide">Read the user guide</a></footer>
  </main>;
}
