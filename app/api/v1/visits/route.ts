import { db } from "../_db";

type CloudflareRequest = Request & { cf?: { country?: string; city?: string } };

function deviceFrom(userAgent: string) {
  if (/tablet|ipad/i.test(userAgent)) return "Tablet";
  if (/mobile|android|iphone/i.test(userAgent)) return "Mobile";
  return "Desktop";
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as { visitorId?: string; path?: string };
    const visitorId = String(body.visitorId ?? "").slice(0, 80);
    if (!visitorId) return Response.json({ error: "Missing visitor ID" }, { status: 400 });
    const cf = (request as CloudflareRequest).cf;
    const database = await db();
    await database.prepare("INSERT INTO site_visits (visitor_id, opened_at, path, country, city, device) VALUES (?, ?, ?, ?, ?, ?)")
      .bind(visitorId, new Date().toISOString(), String(body.path ?? "/").slice(0, 160), cf?.country ?? "Unknown", cf?.city ?? "Unknown", deviceFrom(request.headers.get("user-agent") ?? ""))
      .run();
    return new Response(null, { status: 204 });
  } catch {
    return Response.json({ error: "Visit could not be recorded" }, { status: 400 });
  }
}

export async function GET(request: Request) {
  const database = await db();
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
  const today = new Date().toISOString().slice(0, 10);
  const [totals, recent] = await Promise.all([
    database.prepare("SELECT COUNT(*) AS totalOpens, COUNT(DISTINCT visitor_id) AS uniqueVisitors, COUNT(DISTINCT CASE WHEN substr(opened_at, 1, 10) = ? THEN visitor_id END) AS visitorsToday, COUNT(DISTINCT CASE WHEN opened_at >= ? THEN visitor_id END) AS activeNow FROM site_visits").bind(today, fiveMinutesAgo).first(),
    database.prepare("SELECT opened_at AS openedAt, path, country, city, device FROM site_visits ORDER BY opened_at DESC LIMIT 30").all(),
  ]);
  return Response.json({ data: { totals, recent: recent.results } });
}
