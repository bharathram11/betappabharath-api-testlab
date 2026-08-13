"use client";

import { useCallback, useEffect, useState } from "react";

type Feedback = { id:number; createdAt:string; createdBy:string; type:string; category:string; priority:string; details:string; status:string };
type Visit = { openedAt:string; path:string; country:string; city:string; device:string };
type Analytics = { totals:{ totalOpens:number; uniqueVisitors:number; visitorsToday:number; activeNow:number }; recent:Visit[] };
const statuses = ["Open", "In Review", "Planned", "Fixed", "Closed"];

export default function FeedbackManager() {
  const [items, setItems] = useState<Feedback[]>([]);
  const [ownerKey, setOwnerKey] = useState("");
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadFeedback = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/v1/feedback?status=All&category=All");
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Feedback could not be loaded");
      setItems(data.data);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Feedback could not be loaded");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { void loadFeedback(); }, [loadFeedback]);

  async function loadAnalytics() {
    setError("");
    try {
      const response = await fetch("/api/v1/visits", { headers: { "X-Feedback-Owner-Key": ownerKey } });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Visitor analytics could not be loaded");
      setAnalytics(data.data);
      setMessage("Owner access confirmed. Visitor analytics loaded.");
    } catch (reason) {
      setAnalytics(null);
      setError(reason instanceof Error ? reason.message : "Visitor analytics could not be loaded");
    }
  }

  async function updateStatus(id:number, status:string) {
    setSaving(id); setMessage(""); setError("");
    try {
      const response = await fetch("/api/v1/feedback", { method:"PATCH", headers:{ "Content-Type":"application/json", "X-Feedback-Owner-Key":ownerKey }, body:JSON.stringify({ id, status }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Status was not updated");
      setMessage(data.message);
      setItems(current => current.map(item => item.id === id ? { ...item, status } : item));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Status was not updated");
    } finally { setSaving(null); }
  }

  return <main className="owner-page">
    <header><a href="/feedback">← Public feedback</a><strong>BetappaBharath · Owner controls</strong><a href="/practice#playground">Practice lab</a></header>
    <section className="owner-manager">
      <p className="owner-kicker">PRIVATE MANAGEMENT</p><h1>Owner dashboard</h1>
      <p>Enter your private owner key to see anonymous site-opening activity and manage feedback.</p>
      <div className="owner-login"><label className="owner-key">Private owner key<input type="password" autoComplete="off" value={ownerKey} onChange={event=>setOwnerKey(event.target.value)} placeholder="Enter your private owner key" /></label><button type="button" onClick={loadAnalytics} disabled={!ownerKey}>Open owner dashboard</button></div>
      {message && <p className="owner-success">{message}</p>}{error && <p className="owner-error">{error}</p>}

      <section className="visitor-section">
        <div className="visitor-heading"><div><p className="owner-kicker">SITE VISITORS</p><h2>Anonymous opening activity</h2></div>{analytics && <button type="button" onClick={loadAnalytics}>↻ Refresh</button>}</div>
        {analytics ? <><div className="visitor-stats"><article><span>Active now</span><b>{analytics.totals.activeNow}</b><small>Opened in the last 5 minutes</small></article><article><span>Visitors today</span><b>{analytics.totals.visitorsToday}</b><small>Unique browsers today</small></article><article><span>Unique visitors</span><b>{analytics.totals.uniqueVisitors}</b><small>All time</small></article><article><span>Total opens</span><b>{analytics.totals.totalOpens}</b><small>All recorded sessions</small></article></div><div className="visitor-feed"><h3>Recent site opens</h3>{analytics.recent.length ? analytics.recent.map((visit,index)=><article key={`${visit.openedAt}-${index}`}><span className="visit-dot"/><div><b>{visit.city !== "Unknown" ? `${visit.city}, ${visit.country}` : visit.country}</b><p>Opened <code>{visit.path}</code> on {visit.device}</p></div><time>{new Date(visit.openedAt).toLocaleString()}</time></article>) : <p className="owner-loading">No visits have been recorded yet.</p>}</div></> : <div className="visitor-locked"><b>Visitor analytics is locked</b><p>Enter the owner key above. Only you can see this information.</p></div>}
      </section>

      <section className="feedback-management"><h2>Feedback status</h2>{loading ? <div className="owner-loading">Loading feedback…</div> : items.length ? <div className="owner-ticket-list">{items.map(item=><article key={item.id}><div><b>FB-{String(item.id).padStart(4,"0")}</b><span>{new Date(item.createdAt).toLocaleString()} · {item.createdBy}</span><p>{item.details}</p><small>{item.type} · {item.category} · {item.priority}</small></div><label>Status<select value={item.status} disabled={saving===item.id||!analytics} onChange={event=>updateStatus(item.id,event.target.value)}>{statuses.map(value=><option key={value}>{value}</option>)}</select></label></article>)}</div> : <div className="owner-loading">No feedback submitted yet.</div>}</section>
    </section>
  </main>;
}
