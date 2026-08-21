"use client";

type Mode = "beginner" | "free";
type NegativeKind = "400" | "401" | "403" | "404" | "405" | "409" | "415" | "422" | "429" | "503";
type InspectorData = {
  method: string;
  url: string;
  requestHeaders: Record<string, string>;
  requestBody?: string;
  responseHeaders: Record<string, string>;
};

export function LearningToolsStyles() {
  return <style>{`
    .feedback-fab{position:fixed;right:22px;bottom:22px;z-index:30;padding:9px 13px;border-radius:999px;background:#167d74;color:#fff;text-decoration:none;font-size:10px;font-weight:800;box-shadow:0 10px 24px #10243e33;transition:transform .2s ease,box-shadow .2s ease}.feedback-fab:hover{transform:translateY(-2px);box-shadow:0 14px 28px #10243e40}
    .user-guide-promo{order:12;width:min(1200px,calc(100% - 48px));margin:30px auto;padding:28px;display:flex;align-items:center;justify-content:space-between;gap:24px;border-radius:16px;background:linear-gradient(135deg,#3563e9,#153a75);color:#fff;box-shadow:0 16px 42px #153a7522}.user-guide-promo h2{margin:0;font-size:24px}.user-guide-promo p{margin:5px 0;color:#d7e4f8;font-size:11px}.user-guide-promo a{flex:0 0 auto;padding:11px 15px;border-radius:8px;background:#4ed7c4;color:#10243e;text-decoration:none;font-size:10px;font-weight:800}
    main:not(.swagger-page)>.mode-switcher{order:2}main:not(.swagger-page)>.beginner-section{order:3}main:not(.swagger-page)>.banking-flow-guide{order:4}main:not(.swagger-page)>.practice-data-bar{order:5}main:not(.swagger-page)>.negative-lab{order:6}main:not(.swagger-page)>.session-dashboard{order:7}main:not(.swagger-page)>.playground-section{order:8}main:not(.swagger-page)>.request-inspector{order:9}main:not(.swagger-page)>.assertion-lab{order:10}main:not(.swagger-page)>.challenge-board{order:11}main:not(.swagger-page)>.postman-guide{order:12}main:not(.swagger-page)>.status-section{order:13}main:not(.swagger-page)>footer{order:14}
    .mode-switcher,.practice-data-bar,.negative-lab,.request-inspector,.challenge-board,.postman-guide{width:min(1200px,calc(100% - 48px));margin:24px auto;padding:24px;border:1px solid #d9e2ea;border-radius:16px;background:#fff;box-shadow:0 12px 30px #10243e0a}.mode-switcher,.practice-data-bar,.tool-heading{display:flex;justify-content:space-between;align-items:center;gap:22px}.mode-switcher>div:first-child{display:flex;align-items:center;gap:13px}.mode-switcher p,.practice-data-bar p,.tool-heading p,.negative-lab p,.challenge-board p,.postman-guide p{margin:5px 0;color:#64748b;font-size:11px;line-height:1.6}.mode-icon{display:grid;place-items:center;width:38px;height:38px;border-radius:11px;background:#dff5f0;color:#11776e;font-size:20px}.mode-options{display:flex;gap:3px;padding:4px;border:1px solid #dbe4ea;border-radius:11px;background:#f5f8fa}.mode-options button{min-width:138px;padding:9px 13px;border:1px solid transparent;border-radius:8px;background:transparent;color:#65768a;text-align:left;transition:background .18s ease,color .18s ease,box-shadow .18s ease}.mode-options button b,.mode-options button span{display:block}.mode-options button b{font-size:11px}.mode-options button span{margin-top:2px;font-size:9px}.mode-options button.active{border-color:#10243e;background:#10243e;color:#fff;box-shadow:0 4px 10px #10243e24}.mode-free .beginner-section,.mode-free .banking-flow-guide{display:none}
    .practice-data-bar{background:linear-gradient(135deg,#e9f8f5,#edf3fb)}.practice-data-bar h2,.tool-heading h2,.postman-guide h2{margin:0;font-size:24px;letter-spacing:-.7px}.practice-data-bar>div:last-child{display:flex;gap:8px}.practice-data-bar button,.tool-heading button,.negative-grid button{border:0;border-radius:8px;padding:10px 13px;background:#167d74;color:#fff;font-size:10px;font-weight:800}.practice-data-bar .danger-quiet{border:1px solid #d7a4a4;background:#fff;color:#b42323}.practice-data-bar button:disabled,.negative-grid button:disabled{opacity:.55}
    .negative-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:10px;margin-top:20px}.negative-grid article{display:flex;flex-direction:column;min-height:185px;padding:16px;border:1px solid #e1e7ed;border-radius:11px;background:#fbfcfd}.negative-grid article>span{color:#b45309;font:800 21px 'DM Mono',monospace}.negative-grid h3{margin:13px 0 3px;font-size:12px}.negative-grid article div{flex:1}.negative-grid button{width:100%;background:#10243e}.negative-note{padding:9px 12px;border-radius:7px;background:#fff6df!important;color:#805b13!important}.advanced-errors{margin-top:14px;border:1px solid #cfdbe5;border-radius:11px;background:#f7fafc;overflow:hidden}.advanced-errors>summary{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:14px 16px;cursor:pointer;list-style:none}.advanced-errors>summary::-webkit-details-marker{display:none}.advanced-errors>summary div{display:grid;gap:3px}.advanced-errors>summary b{font-size:11px}.advanced-errors>summary span{color:#64748b;font-size:9px}.advanced-errors>summary i{padding:5px 8px;border-radius:6px;background:#10243e;color:#fff;font-size:8px;font-style:normal}.advanced-errors[open]>summary{border-bottom:1px solid #dce5ec}.advanced-errors .negative-grid{margin:0;padding:14px}.advanced-errors .negative-grid article{background:#fff}
    .inspector-grid{display:grid;grid-template-columns:1.25fr .75fr;gap:13px;margin-top:20px}.inspector-grid article{overflow:hidden;border:1px solid #dce4eb;border-radius:11px;background:#f9fbfd}.inspector-grid header{display:flex;align-items:center;gap:9px;padding:12px 15px;border-bottom:1px solid #dce4eb;background:#eef3f7;font-size:11px}.inspector-dot{color:#4ed7c4}.inspector-grid dl{margin:0}.inspector-grid dl>div{display:grid;grid-template-columns:125px 1fr;border-bottom:1px solid #e6ecf1}.inspector-grid dt,.inspector-grid dd{margin:0;padding:9px 13px;font-size:9px}.inspector-grid dt{font-weight:800}.inspector-grid code{font:9px 'DM Mono',monospace;word-break:break-all}.inspector-grid h3{margin:13px 14px 7px;font-size:10px}.inspector-grid pre{overflow:auto;max-height:250px;margin:0 13px 13px;padding:13px;border-radius:8px;background:#10243e;color:#d9e8f4;font:10px/1.6 'DM Mono',monospace}.tool-empty{display:grid;place-items:center;min-height:165px;margin-top:18px;border:1px dashed #c6d1dc;border-radius:11px;color:#64748b;text-align:center}.tool-empty span{color:#4ed7c4;font-size:25px}.tool-empty p{max-width:500px}
    .challenge-board{background:#10243e;color:#fff}.challenge-board .tool-heading p{color:#aebfd0}.light-button{border:1px solid #5d7288!important;background:transparent!important}.challenge-progress{display:flex;align-items:center;gap:13px;margin:20px 0}.challenge-progress>div{height:8px;flex:1;overflow:hidden;border-radius:20px;background:#30465d}.challenge-progress>div span{display:block;height:100%;border-radius:20px;background:#4ed7c4}.challenge-progress>b{font-size:10px}.challenge-cards{display:grid;grid-template-columns:repeat(5,1fr);gap:9px}.challenge-cards article{min-height:140px;padding:14px;border:1px solid #415a72;border-radius:10px;background:#132d49}.challenge-cards article>span{display:grid;place-items:center;width:24px;height:24px;border-radius:50%;background:#314c68;font-size:10px}.challenge-cards h3{margin:13px 0 4px;font-size:11px}.challenge-cards p{color:#b8c7d5;font-size:9px}.challenge-cards article>b{color:#91a4b7;font-size:8px}.challenge-cards article.complete{border-color:#4ed7c4;background:#123b42}.challenge-cards article.complete>span{background:#4ed7c4;color:#10243e}.challenge-cards article.complete>b{color:#70e0ca}
    .postman-guide{display:grid;grid-template-columns:.8fr 1.2fr;gap:42px;align-items:center;background:linear-gradient(135deg,#f2f0ff,#e9f8f5)}.postman-guide a{display:inline-block;margin-top:14px;padding:10px 14px;border-radius:8px;background:#3563e9;color:#fff;text-decoration:none;font-size:10px;font-weight:800}.postman-guide ol{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin:0;padding:0;list-style:none}.postman-guide li{display:flex;gap:9px;padding:13px;border:1px solid #d7e1e8;border-radius:9px;background:#fff}.postman-guide li>span{display:grid;place-items:center;flex:0 0 24px;height:24px;border-radius:7px;background:#dff5f0;color:#11776e;font-weight:800}.postman-guide b{font-size:10px}.postman-guide li p{font-size:9px}
    @media(max-width:900px){.negative-grid{grid-template-columns:repeat(2,1fr)}.challenge-cards{grid-template-columns:repeat(2,1fr)}.inspector-grid,.postman-guide{grid-template-columns:1fr}.mode-switcher,.practice-data-bar{align-items:flex-start;flex-direction:column}}@media(max-width:560px){.mode-switcher,.practice-data-bar,.negative-lab,.request-inspector,.challenge-board,.postman-guide{width:calc(100% - 24px);padding:19px}.mode-options{width:100%}.mode-options button{min-width:0;flex:1}.negative-grid,.challenge-cards,.postman-guide ol{grid-template-columns:1fr}.practice-data-bar>div:last-child{width:100%;flex-direction:column}.inspector-grid dl>div{grid-template-columns:1fr}.inspector-grid dd{padding-top:0}.tool-heading{align-items:flex-start;flex-direction:column}}
  `}</style>;
}

export function ModeSwitcher({ mode, onChange }: { mode: Mode; onChange: (mode: Mode) => void }) {
  return <section id="learn" className="mode-switcher" aria-label="Practice experience">
    <div><span className="mode-icon">◎</span><div><b>Choose your learning style</b><p>{mode === "beginner" ? "Helpful explanations are visible." : "A focused workspace for independent testing."}</p></div></div>
    <div className="mode-options">
      <button type="button" className={mode === "beginner" ? "active" : ""} onClick={() => onChange("beginner")}><b>Beginner mode</b><span>Guided learning</span></button>
      <button type="button" className={mode === "free" ? "active" : ""} onClick={() => onChange("free")}><b>Free practice</b><span>Minimal guidance</span></button>
    </div>
  </section>;
}

export function PracticeDataControls({ busy, onLoad, onReset }: { busy: string; onLoad: () => void; onReset: () => void }) {
  return <section className="practice-data-bar"><div><p className="eyebrow">Practice data</p><h2>Start with a sample bank or begin empty</h2><p>Sample data creates Betappa Bharath with two accounts. Reset removes all customers, accounts, and transactions.</p></div><div><button type="button" disabled={Boolean(busy)} onClick={onLoad}>{busy === "load-sample" ? "Loading…" : "Load sample bank"}</button><button type="button" className="danger-quiet" disabled={Boolean(busy)} onClick={onReset}>{busy === "reset" ? "Resetting…" : "Reset all data"}</button></div></section>;
}

export function RequestInspector({ data, onCopyCurl, copied }: { data: InspectorData | null; onCopyCurl: () => void; copied: boolean }) {
  return <section className="request-inspector">
    <div className="tool-heading"><div><p className="eyebrow">Request inspector</p><h2>See exactly what travelled over HTTP</h2></div>{data && <button type="button" onClick={onCopyCurl}>{copied ? "cURL copied" : "Copy as cURL"}</button>}</div>
    {data ? <div className="inspector-grid">
      <article><header><span className={`method-badge ${data.method.toLowerCase()}`}>{data.method}</span><b>Request</b></header><dl><div><dt>URL</dt><dd><code>{data.url}</code></dd></div>{Object.entries(data.requestHeaders).map(([key, value]) => <div key={key}><dt>{key}</dt><dd><code>{value}</code></dd></div>)}</dl>{data.requestBody && <><h3>Body</h3><pre>{data.requestBody}</pre></>}</article>
      <article><header><span className="inspector-dot">●</span><b>Response headers</b></header><dl>{Object.entries(data.responseHeaders).length ? Object.entries(data.responseHeaders).map(([key, value]) => <div key={key}><dt>{key}</dt><dd><code>{value}</code></dd></div>) : <div><dt>Waiting</dt><dd>Send a request to inspect headers.</dd></div>}</dl></article>
    </div> : <div className="tool-empty"><span>↗</span><b>No request inspected yet</b><p>Send any request in the playground. Its method, URL, headers, body, and response headers will appear here.</p></div>}
  </section>;
}

const negativeTests: { code: NegativeKind; title: string; copy: string }[] = [
  { code: "401", title: "Missing token", copy: "Send a protected request without Authorization." },
  { code: "404", title: "Unknown customer", copy: "Request a customer ID that does not exist." },
  { code: "400", title: "Missing fields", copy: "Create a customer without mandatory fields." },
  { code: "409", title: "Account has balance", copy: "Try deleting an account that still has money." },
  { code: "422", title: "Insufficient funds", copy: "Withdraw more money than the available balance." },
];

const advancedNegativeTests: { code: NegativeKind; title: string; copy: string }[] = [
  { code: "403", title: "Forbidden scope", copy: "Use a valid token that lacks permission for an admin operation." },
  { code: "405", title: "Wrong HTTP method", copy: "Send PUT to a resource that allows only GET or POST." },
  { code: "415", title: "Wrong content type", copy: "Send text/plain where the API requires application/json." },
  { code: "429", title: "Rate limit reached", copy: "Inspect Retry-After and X-RateLimit response headers." },
  { code: "503", title: "Service unavailable", copy: "Simulate maintenance and learn when a client should retry." },
];

export function NegativeTestingLab({ running, onRun }: { running: string; onRun: (kind: NegativeKind) => void }) {
  return <section className="negative-lab">
    <div className="tool-heading"><div><p className="eyebrow">Negative testing lab</p><h2>Learn why APIs reject requests</h2><p>Good testers verify failure responses as carefully as successful responses.</p></div></div>
    <div className="negative-grid">{negativeTests.map((test) => <article key={test.code}><span>{test.code}</span><div><h3>{test.title}</h3><p>{test.copy}</p></div><button type="button" disabled={Boolean(running)} onClick={() => onRun(test.code)}>{running === test.code ? "Running…" : "Run test"}</button></article>)}</div>
    <details className="advanced-errors"><summary><div><b>Advanced HTTP errors</b><span>Permissions, methods, media types, rate limiting, and service availability</span></div><i>5 more tests</i></summary><div className="negative-grid">{advancedNegativeTests.map((test) => <article key={test.code}><span>{test.code}</span><div><h3>{test.title}</h3><p>{test.copy}</p></div><button type="button" disabled={Boolean(running)} onClick={() => onRun(test.code)}>{running === test.code ? "Running…" : "Run test"}</button></article>)}</div></details>
    <p className="negative-note">The result opens in the normal response panel, request history, assertions, and inspector.</p>
  </section>;
}

export function ChallengeBoard() {
  return <section className="challenge-board challenge-launcher">
    <div><p className="eyebrow">New game mode</p><h2>Enter the Banking API Quest</h2><p>Build requests manually across ten real API missions, from authentication and transfers to advanced PATCH, DELETE, and negative testing.</p><div className="challenge-features"><span>10 missions</span><span>1000 XP</span><span>Manual requests</span><span>Boss levels</span></div></div>
    <div className="challenge-launch-card"><span>★</span><b>Ready, tester?</b><p>Your game opens on a separate page, so the free-practice workspace stays focused.</p><a href="/challenges">Start the challenge →</a></div>
  </section>;
}

export function PostmanGuide() {
  return <><section className="user-guide-promo"><div><p className="eyebrow">Need help?</p><h2>Read the complete user guide</h2><p>Learn every feature, the banking workflow, assertions, negative tests, Postman setup, status codes, and troubleshooting.</p></div><a href="/guide">Open User Guide</a></section><section className="postman-guide">
    <div><p className="eyebrow">Continue in Postman</p><h2>A ready-made collection for desktop API testing</h2><p>The collection includes folders, bearer authorization, realistic bodies, variables, and automatic ID-saving scripts.</p><a href="/postman-collection.json" download="BetappaBharath-Banking-API.postman_collection.json">Download Postman collection</a></div>
    <ol><li><span>1</span><div><b>Download and import</b><p>In Postman choose Import, then select the downloaded JSON file.</p></div></li><li><span>2</span><div><b>Run Create access token</b><p>The collection automatically stores the returned bearer token.</p></div></li><li><span>3</span><div><b>Create your banking data</b><p>Customer and account IDs are automatically saved into variables.</p></div></li><li><span>4</span><div><b>Test freely</b><p>Change bodies, IDs, and headers to practise positive and negative cases.</p></div></li></ol>
  </section></>;
}

export type { InspectorData, Mode, NegativeKind };
