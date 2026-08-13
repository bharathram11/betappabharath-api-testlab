"use client";

import { useCallback, useEffect, useState } from "react";

type Visit = { openedAt:string; path:string; country:string; city:string; device:string };
type Analytics = { totals:{ totalOpens:number; uniqueVisitors:number; visitorsToday:number; activeNow:number }; recent:Visit[] };

function relativeTime(date: string) {
  const seconds = Math.max(0, Math.floor((Date.now() - Date.parse(date)) / 1000));
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return hours < 24 ? `${hours}h ago` : `${Math.floor(hours / 24)}d ago`;
}

export default function PublicVisitorActivity() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [error, setError] = useState(false);
  const load = useCallback(async () => {
    try {
      const response = await fetch("/api/v1/visits", { cache: "no-store" });
      if (!response.ok) throw new Error();
      const payload = await response.json();
      setAnalytics(payload.data);
      setError(false);
    } catch { setError(true); }
  }, []);

  useEffect(() => {
    const first = window.setTimeout(() => void load(), 350);
    const refresh = window.setInterval(() => void load(), 30000);
    return () => { window.clearTimeout(first); window.clearInterval(refresh); };
  }, [load]);

  return <section className="public-visitors" aria-labelledby="visitor-title">
    <div className="public-visitor-heading"><div><p className="eyebrow">Live community</p><h2 id="visitor-title">Live traffic</h2><p>See anonymous site openings from the learning community.</p></div><span><i /> Live now</span></div>
    {analytics ? <div className="public-visitor-layout"><div className="public-visitor-stats"><article><b>{analytics.totals.activeNow}</b><span>Active now</span><small>Last 5 minutes</small></article><article><b>{analytics.totals.visitorsToday}</b><span>Visitors today</span><small>Unique browsers</small></article><article><b>{analytics.totals.uniqueVisitors}</b><span>All visitors</span><small>Since tracking began</small></article><article><b>{analytics.totals.totalOpens}</b><span>Total opens</span><small>All sessions</small></article></div><div className="public-visitor-feed"><h3>Recent site opens</h3>{analytics.recent.slice(0,5).map((visit,index)=><article key={`${visit.openedAt}-${index}`}><span className="public-visit-dot"/><div><b>{visit.city !== "Unknown" ? `${visit.city}, ${visit.country}` : visit.country}</b><p>Opened <code>{visit.path}</code> · {visit.device}</p></div><time>{relativeTime(visit.openedAt)}</time></article>)}{!analytics.recent.length && <p className="public-visitor-empty">You are the first recorded visitor.</p>}</div></div> : <div className="public-visitor-loading">{error ? "Visitor activity is temporarily unavailable." : "Loading live visitor activity…"}</div>}
    <p className="public-visitor-privacy">Privacy friendly: no names, emails, complete IP addresses, or tokens are collected.</p>
  </section>;
}
