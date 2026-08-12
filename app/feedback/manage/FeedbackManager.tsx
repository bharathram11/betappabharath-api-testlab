"use client";

import { FormEvent, useState } from "react";

const statuses = ["Open", "In Review", "Planned", "Fixed", "Closed"];

export default function FeedbackManager() {
  const [ticket, setTicket] = useState("");
  const [status, setStatus] = useState("In Review");
  const [ownerKey, setOwnerKey] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function updateStatus(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");
    const id = Number(ticket.replace(/^FB-/i, ""));
    try {
      const response = await fetch("/api/v1/feedback", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "X-Feedback-Owner-Key": ownerKey },
        body: JSON.stringify({ id, status }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Status was not updated");
      setMessage(data.message);
      setTicket("");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Status was not updated");
    } finally {
      setSaving(false);
    }
  }

  return <main className="owner-page"><header><a href="/feedback">← Public feedback</a><strong>BetappaBharath · Owner controls</strong><a href="/practice#playground">Practice lab</a></header><section><p className="owner-kicker">PRIVATE MANAGEMENT</p><h1>Update feedback status</h1><p>Only a request containing your private Cloudflare owner key can update a ticket.</p><form onSubmit={updateStatus}><label>Feedback ticket ID<input required value={ticket} onChange={event => setTicket(event.target.value)} placeholder="Example: FB-0001 or 1" /></label><label>New status<select value={status} onChange={event => setStatus(event.target.value)}>{statuses.map(value => <option key={value}>{value}</option>)}</select></label><label>Private owner key<input required type="password" autoComplete="off" value={ownerKey} onChange={event => setOwnerKey(event.target.value)} placeholder="Enter your owner key" /></label><button disabled={saving}>{saving ? "Updating…" : "Update status"}</button>{message && <p className="owner-success">{message}</p>}{error && <p className="owner-error">{error}</p>}</form><aside><b>Suggested workflow</b><ol><li>Open — newly submitted</li><li>In Review — you are checking it</li><li>Planned — accepted for a future update</li><li>Fixed — correction deployed</li><li>Closed — no further action needed</li></ol></aside></section></main>;
}
