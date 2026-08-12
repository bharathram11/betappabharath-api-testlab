import { env } from "cloudflare:workers";

const tableSql = `CREATE TABLE IF NOT EXISTS feedback (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at TEXT NOT NULL,
  created_by TEXT NOT NULL,
  email TEXT NOT NULL,
  type TEXT NOT NULL,
  category TEXT NOT NULL,
  priority TEXT NOT NULL,
  details TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Open'
)`;

async function database() {
  const db = env.DB as D1Database;
  await db.prepare(tableSql).run();
  await db.prepare("CREATE INDEX IF NOT EXISTS idx_feedback_status_created ON feedback (status, created_at DESC)").run();
  return db;
}

export async function GET(request: Request) {
  const db = await database();
  const url = new URL(request.url);
  const status = url.searchParams.get("status") ?? "All";
  const category = url.searchParams.get("category") ?? "All";
  let sql = "SELECT id, created_at AS createdAt, created_by AS createdBy, type, category, priority, details, status FROM feedback WHERE 1=1";
  const values: string[] = [];
  if (status !== "All") { sql += " AND status = ?"; values.push(status); }
  if (category !== "All") { sql += " AND category = ?"; values.push(category); }
  sql += " ORDER BY id DESC LIMIT 100";
  const statement = db.prepare(sql);
  const result = values.length ? await statement.bind(...values).all() : await statement.all();
  return Response.json({ data: result.results });
}

export async function POST(request: Request) {
  const db = await database();
  try {
    const body = await request.json() as Record<string, unknown>;
    const required = ["createdBy", "email", "type", "category", "priority", "details"];
    const missing = required.filter((field) => !String(body[field] ?? "").trim());
    if (missing.length) return Response.json({ error: "Validation failed", message: `Required fields: ${missing.join(", ")}` }, { status: 400 });
    if (String(body.details).trim().length < 10) return Response.json({ error: "Validation failed", message: "Feedback details must contain at least 10 characters" }, { status: 400 });
    const createdAt = new Date().toISOString();
    const result = await db.prepare("INSERT INTO feedback (created_at, created_by, email, type, category, priority, details, status) VALUES (?, ?, ?, ?, ?, ?, ?, 'Open')")
      .bind(createdAt, String(body.createdBy).trim(), String(body.email).trim(), String(body.type), String(body.category), String(body.priority), String(body.details).trim()).run();
    return Response.json({ data: { id: result.meta.last_row_id, createdAt, createdBy: String(body.createdBy).trim(), type: body.type, category: body.category, priority: body.priority, details: String(body.details).trim(), status: "Open" } }, { status: 201 });
  } catch {
    return Response.json({ error: "Invalid request", message: "Send a valid JSON feedback form" }, { status: 400 });
  }
}

const allowedStatuses = ["Open", "In Review", "Planned", "Fixed", "Closed"];

export async function PATCH(request: Request) {
  const configuredOwnerKey = String((env as unknown as { FEEDBACK_OWNER_KEY?: string }).FEEDBACK_OWNER_KEY ?? "");
  const suppliedOwnerKey = request.headers.get("X-Feedback-Owner-Key") ?? "";
  if (!configuredOwnerKey || suppliedOwnerKey !== configuredOwnerKey) {
    return Response.json({ error: "Forbidden", message: "Only the site owner can update feedback status." }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try { body = await request.json() as Record<string, unknown>; }
  catch { return Response.json({ error: "Invalid JSON" }, { status: 400 }); }

  const id = Number(body.id);
  const status = String(body.status ?? "");
  if (!Number.isInteger(id) || id < 1 || !allowedStatuses.includes(status)) {
    return Response.json({ error: "Validation failed", message: "A valid feedback ID and status are required." }, { status: 400 });
  }

  const db = await database();
  const existing = await db.prepare("SELECT id FROM feedback WHERE id = ?").bind(id).first();
  if (!existing) return Response.json({ error: "Not found", message: "Feedback ticket was not found." }, { status: 404 });
  await db.prepare("UPDATE feedback SET status = ? WHERE id = ?").bind(status, id).run();
  return Response.json({ data: { id, status }, message: `Feedback FB-${String(id).padStart(4, "0")} updated to ${status}.` });
}
