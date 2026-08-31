import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "What's New | BetappaBharath Banking API TestLab",
  description: "See the latest features, improvements, and fixes in the Banking API TestLab.",
};

const releases = [
  {
    date: "31 August 2026",
    version: "SDET learning update",
    title: "Failure simulation, data-driven tests, and career preparation",
    summary: "Move beyond individual requests with controlled defects, reusable datasets, interview practice, and a recruiter-ready project tour.",
    changes: [
      ["Added", "A safe API defect simulator covering latency, timeout, 500, 429, expired tokens, malformed JSON, missing fields, flaky services, and duplicate requests."],
      ["Added", "CSV and JSON data-driven customer testing with expected-versus-actual validation and downloadable execution reports."],
      ["Added", "An API and SDET interview-preparation center with filters, mock questions, answer checklists, and project-specific guidance."],
      ["Added", "A captioned, self-running two-minute project walkthrough for recruiters, educators, and new learners."],
      ["Improved", "Advanced capabilities use dedicated pages so the primary practice experience remains compact."],
    ],
  },
  {
    date: "21 August 2026",
    version: "Usability update",
    title: "Faster practice and shareable achievements",
    summary: "Find requests faster, understand responses clearly, and share a completed Banking API Quest.",
    changes: [
      ["Added", "Operation search by HTTP method, resource, endpoint, or action."],
      ["Added", "Copy JSON, download response, and clear-response actions in the response panel."],
      ["Added", "Plain-language explanations for important success and error status codes."],
      ["Added", "A challenge completion summary with missions, attempts, rank, status codes, and a copyable achievement message."],
    ],
  },
  {
    date: "21 August 2026",
    version: "Advanced testing",
    title: "Real-world HTTP error practice",
    summary: "Practise permissions, unsupported methods and media types, rate limiting, and temporary service failures.",
    changes: [
      ["Added", "Interactive 403 Forbidden, 405 Method Not Allowed, 415 Unsupported Media Type, 429 Too Many Requests, and 503 Service Unavailable tests."],
      ["Added", "Realistic Allow, Retry-After, and X-RateLimit response headers visible in the Request Inspector."],
      ["Improved", "The status-code reference and user guide now explain thirteen important success and error responses."],
      ["Improved", "Advanced cases are collapsible so the main learning page stays compact."],
    ],
  },
  {
    date: "18 August 2026",
    version: "Game mode",
    title: "Banking API Quest",
    summary: "Build complete requests manually across ten banking API missions with progress, XP, boss levels, and instant validation.",
    changes: [
      ["Added", "A dedicated game page with ten selectable banking missions and 1000 available XP."],
      ["Added", "Manual HTTP method, URL, and JSON challenges with optional hints, request validation, Bearer headers, and live API responses."],
      ["Added", "Advanced boss missions covering insufficient funds, PATCH updates, DELETE protection, 422, and 409 responses."],
      ["Added", "Automatic Customer ID and Account ID capture across customer, account, deposit, transfer, and verification missions."],
      ["Added", "Mission scoring, winning streaks, retry guidance, session restoration, rank progression, and a champion badge."],
      ["Improved", "The homepage now uses a compact challenge launcher so the main practice page remains easy to scan."],
    ],
  },
  {
    date: "17 August 2026",
    version: "New feature",
    title: "Rest Assured and Playwright code generator",
    summary: "Turn the request you just tested into a copy-ready API automation test.",
    changes: [
      ["Added", "Rest Assured Java generation with JUnit status and JSON-path assertions."],
      ["Added", "Playwright TypeScript generation using APIRequestContext and expect assertions."],
      ["Added", "Copy code, framework setup help, and support for GET, POST, PUT, PATCH, and DELETE."],
      ["Improved", "A sticky Learn, Practice, Automate, and Results navigator makes the long workspace easier to explore."],
      ["Improved", "204 No Content requests avoid invalid JSON-response parsing."],
      ["Improved", "Real Bearer tokens are replaced by a safe ACCESS_TOKEN environment variable."],
    ],
  },
  {
    date: "17 August 2026",
    version: "Latest update",
    title: "Live Postman collection",
    summary: "Use every current banking API directly from Postman without running localhost.",
    changes: [
      ["Added", "A downloadable collection containing all 16 current banking requests."],
      ["Improved", "The collection now uses the public Cloudflare URL by default."],
      ["Improved", "Token, Customer ID, and Account IDs are saved automatically."],
      ["Fixed", "Customer bodies and the secondary-account withdrawal now match the practice page."],
      ["Fixed", "The user guide no longer contains outdated localhost instructions."],
    ],
  },
  {
    date: "13 August 2026",
    version: "Authentication update",
    title: "Real token request and expiry practice",
    summary: "Generate a Bearer token through a real authentication request and understand its lifetime.",
    changes: [
      ["Added", "POST /api/v1/auth/token as a dedicated practice operation."],
      ["Added", "15, 30, 45, and 60-minute token expiry examples using seconds."],
      ["Added", "A visible remaining-time countdown and automatic Bearer authorization."],
      ["Fixed", "Invalid expiry values now return a clear 400 validation response."],
      ["Improved", "Expiry guidance appears only beside the authentication request body."],
    ],
  },
  {
    date: "12 August 2026",
    version: "Learning experience",
    title: "A complete retail-banking API practice flow",
    summary: "Practise realistic customer, account, transaction, and transfer operations in one place.",
    changes: [
      ["Added", "Customer and multi-account creation with automatically saved IDs."],
      ["Added", "Deposits, withdrawals, transfers, transaction history, PUT, PATCH, and DELETE examples."],
      ["Added", "Assertions, negative testing, Request Inspector, cURL copy, challenges, and session progress."],
      ["Added", "Swagger reference, feedback tracking, public visitor activity, and a detailed user guide."],
      ["Improved", "Practice data is persistent and isolated by each user's access token."],
    ],
  },
];

export default function WhatsNewPage() {
  return <main className="updates-page">
    <header className="updates-nav">
      <Link href="/"><span>B</span><strong>BetappaBharath <em>API TestLab</em></strong></Link>
      <nav><Link href="/guide">User Guide</Link><Link href="/swagger">Swagger</Link><Link href="/challenges">Challenges</Link><a className="updates-primary" href="/#playground">Open Practice Lab</a></nav>
    </header>

    <section className="updates-hero">
      <div><p>Product updates</p><h1>What&apos;s new in the TestLab?</h1><span>Follow newly added features, improvements, and fixes. The newest update always appears first.</span></div>
      <aside><b>Latest</b><strong>SDET learning and career tools</strong><span>Updated 31 August 2026</span></aside>
    </section>

    <section className="updates-content">
      <div className="updates-intro"><div><p>Release history</p><h2>Built to make API testing easier to learn.</h2></div><Link href="/postman-collection.json">Download latest Postman collection</Link></div>
      <div className="release-list">{releases.map((release, index) => <article className="release" key={release.title}>
        <div className="release-date"><span>{release.date}</span>{index === 0 && <b>Newest</b>}</div>
        <div className="release-card"><p>{release.version}</p><h2>{release.title}</h2><span>{release.summary}</span><ul>{release.changes.map(([type, copy]) => <li key={copy}><b className={`change-${type.toLowerCase()}`}>{type}</b><p>{copy}</p></li>)}</ul></div>
      </article>)}</div>
    </section>

    <footer><div><b>Have an improvement idea?</b><span>Share it through the public feedback page.</span></div><Link href="/feedback">Give feedback</Link></footer>
  </main>;
}
