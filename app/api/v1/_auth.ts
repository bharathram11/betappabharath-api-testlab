import { db } from "./_db";

export async function issueAccessToken(email: string, requestedExpiresIn: number) {
  const database = await db();
  const accessToken = `bbl_${crypto.randomUUID().replaceAll("-", "")}`;
  const sessionId = crypto.randomUUID();
  const allowedDurations = [60 * 15, 60 * 30, 60 * 45, 60 * 60];
  const expiresIn = allowedDurations.includes(requestedExpiresIn) ? requestedExpiresIn : 60 * 60;
  const expiresAt = Date.now() + expiresIn * 1000;
  await database.prepare("INSERT INTO practice_sessions (id, token, email, expires_at, created_at) VALUES (?, ?, ?, ?, ?)").bind(sessionId, accessToken, email, expiresAt, new Date().toISOString()).run();
  return { accessToken, expiresIn, expiresAt, sessionId };
}

export async function getSessionId(request: Request) {
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) return null;
  const token = authorization.slice(7).trim();
  const database = await db();
  const row = await database.prepare("SELECT id FROM practice_sessions WHERE token = ? AND expires_at > ?").bind(token, Date.now()).first<{ id: string }>();
  return row?.id ?? null;
}

export async function hasValidBearerToken(request: Request) { return Boolean(await getSessionId(request)); }

export function unauthorizedResponse() { return Response.json({ error: "Unauthorized", message: "Create an access token, then send Authorization: Bearer <access_token>." }, { status: 401 }); }
