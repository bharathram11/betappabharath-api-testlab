"use client";

import { useEffect, useState } from "react";

const slides = [
  { label: "Welcome", title: "A hands-on Banking API TestLab", copy: "Built by Betappa Bharath to help beginners and SDETs practise realistic APIs safely in a browser, Swagger, or Postman.", method: "GET", path: "/api/v1/customers", status: "200 OK", body: '{\n  "project": "Banking API TestLab",\n  "audience": ["QA", "SDET", "Educators"]\n}' },
  { label: "Authentication", title: "Generate a real temporary Bearer token", copy: "Choose an expiry, send the authentication request, and watch the token attach automatically to protected calls.", method: "POST", path: "/api/v1/auth/token", status: "201 Created", body: '{\n  "access_token": "bbl_••••••••",\n  "expires_in": 900,\n  "token_type": "Bearer"\n}' },
  { label: "Banking workflow", title: "Create connected banking records", copy: "Create a customer, open multiple accounts, deposit, withdraw, transfer, and verify transaction history with saved IDs.", method: "POST", path: "/api/v1/customers/{id}/accounts", status: "201 Created", body: '{\n  "id": "ACC-5001",\n  "nickname": "Salary Account",\n  "balance": 10000\n}' },
  { label: "Negative testing", title: "Learn from realistic API errors", copy: "Practise 400, 401, 403, 404, 409, 415, 422, 429, 500, and 503 responses with clear explanations.", method: "POST", path: "/api/v1/accounts/{id}/transactions", status: "422", body: '{\n  "error": "Insufficient funds",\n  "message": "Available balance is INR 2,000"\n}' },
  { label: "SDET tools", title: "Simulate failures and run test data", copy: "Trigger controlled timeouts, malformed JSON, server errors, rate limits, and run CSV or JSON datasets with row-level reports.", method: "POST", path: "/api/v1/simulator", status: "429", body: '{\n  "error": "Too Many Requests",\n  "retryAfter": 30\n}' },
  { label: "Automation", title: "Turn a request into starter test code", copy: "Generate safe Rest Assured Java or Playwright TypeScript from the request you just tested, with status and field assertions.", method: "JAVA", path: "Rest Assured", status: "PASS", body: 'given()\n  .baseUri(BASE_URL)\n.when()\n  .get("/api/v1/customers")\n.then()\n  .statusCode(200);' },
  { label: "Challenge mode", title: "Build requests manually and earn XP", copy: "Ten banking missions validate the method, URL, JSON, status, and response so learners gain practical confidence.", method: "QUEST", path: "Mission 10 / 10", status: "1000 XP", body: '{\n  "rank": "Banking API Champion",\n  "assertions": "PASS"\n}' },
  { label: "Ready to explore", title: "One public project—many ways to learn", copy: "Use the live practice lab, Swagger, Postman collection, SDET tools, interview preparation, and feedback tracker completely free.", method: "LIVE", path: "bharathbetappa.workers.dev", status: "READY", body: '{\n  "builtBy": "Betappa Bharath",\n  "next": "Start practising"\n}' },
];

const secondsPerSlide = 15;

export default function DemoTour() {
  const [playing, setPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const totalSeconds = slides.length * secondsPerSlide;
  const index = Math.min(slides.length - 1, Math.floor(elapsed / secondsPerSlide));
  const slide = slides[index];

  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(() => setElapsed((current) => current >= totalSeconds - 1 ? 0 : current + 1), 1000);
    return () => window.clearInterval(timer);
  }, [playing, totalSeconds]);

  function restart() { setElapsed(0); setPlaying(true); }
  function formatTime(value: number) { return `${Math.floor(value / 60)}:${String(value % 60).padStart(2, "0")}`; }

  return <main className="demo-page"><header className="tool-nav"><a href="/"><span>B</span><strong>BetappaBharath <em>API TestLab</em></strong></a><nav><a href="/sdet-lab">SDET Lab</a><a href="/interview-prep">Interview Prep</a><a href="/#playground">Open Project</a></nav></header><section className="demo-intro"><div><p>Recruiter and educator walkthrough</p><h1>Understand the complete project in two minutes.</h1><span>Press play for a captioned, self-running tour. Pause or jump to any chapter whenever you want.</span></div><a href="/#playground">Explore the live project →</a></section><section className="demo-player"><div className="demo-screen"><div className="demo-screen-top"><span>BetappaBharath API TestLab</span><b>{slide.label}</b></div><div className="demo-scene" key={index}><section><p>Chapter {String(index + 1).padStart(2, "0")}</p><h2>{slide.title}</h2><span>{slide.copy}</span><div><b>Live and free</b><b>Built for QA & SDET</b></div></section><aside><header><b>{slide.method}</b><code>{slide.path}</code><span>{slide.status}</span></header><pre>{slide.body}</pre><footer>Request in → response, assertions, and learning out</footer></aside></div><div className="demo-caption"><b>{slide.label}</b><span>{slide.copy}</span></div></div><div className="demo-controls"><button type="button" onClick={() => setPlaying((current) => !current)}>{playing ? "Pause" : "Play 2-minute demo"}</button><button type="button" onClick={restart}>Restart</button><span>{formatTime(elapsed)} / {formatTime(totalSeconds)}</span></div><div className="demo-progress"><i style={{ width: `${elapsed / totalSeconds * 100}%` }} /></div><div className="demo-chapters">{slides.map((item, slideIndex) => <button type="button" className={slideIndex === index ? "active" : ""} key={item.label} onClick={() => { setElapsed(slideIndex * secondsPerSlide); setPlaying(false); }}><span>{slideIndex + 1}</span><b>{item.label}</b></button>)}</div></section><section className="demo-links"><div><p>Continue exploring</p><h2>See the features in action</h2></div><a href="/#playground">API Practice</a><a href="/sdet-lab">SDET Lab</a><a href="/challenges">Challenge Game</a><a href="/swagger">Swagger</a></section><footer>Built and maintained by Betappa Bharath · <a href="https://www.linkedin.com/in/betappa-bharathb111/" target="_blank" rel="noopener noreferrer">LinkedIn ↗</a></footer></main>;
}
