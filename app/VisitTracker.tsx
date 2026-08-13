"use client";

import { useEffect } from "react";

export default function VisitTracker() {
  useEffect(() => {
    if (sessionStorage.getItem("bbl-visit-recorded")) return;
    let visitorId = localStorage.getItem("bbl-anonymous-visitor");
    if (!visitorId) {
      visitorId = crypto.randomUUID();
      localStorage.setItem("bbl-anonymous-visitor", visitorId);
    }
    sessionStorage.setItem("bbl-visit-recorded", "true");
    void fetch("/api/v1/visits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ visitorId, path: window.location.pathname }),
      keepalive: true,
    });
  }, []);
  return null;
}
