import { hasValidBearerToken, unauthorizedResponse } from "../_auth";

const pause = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds));

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try { body = await request.json() as Record<string, unknown>; }
  catch { return Response.json({ error: "Invalid JSON", message: "Send a JSON body containing a defect value." }, { status: 400 }); }

  const defect = String(body.defect ?? "baseline");
  const attempt = Number(body.attempt ?? 1);
  if (defect === "expired-token") return Response.json({ error: "Unauthorized", message: "The access token has expired. Generate a new token and retry." }, { status: 401, headers: { "WWW-Authenticate": "Bearer error=\"invalid_token\"" } });
  if (!await hasValidBearerToken(request)) return unauthorizedResponse();

  if (defect === "slow-response") {
    await pause(1600);
    return Response.json({ data: { id: "SIM-2001", status: "completed" }, warning: "The response was intentionally delayed." });
  }
  if (defect === "timeout") {
    await pause(3500);
    return Response.json({ data: { id: "SIM-2002", status: "completed" } });
  }
  if (defect === "server-error") return Response.json({ error: "Internal Server Error", message: "A simulated downstream banking service failed.", requestId: crypto.randomUUID() }, { status: 500 });
  if (defect === "rate-limit") return Response.json({ error: "Too Many Requests", message: "The simulated request limit has been reached." }, { status: 429, headers: { "Retry-After": "30", "X-RateLimit-Limit": "10", "X-RateLimit-Remaining": "0" } });
  if (defect === "missing-field") return Response.json({ data: { firstName: "Betappa", lastName: "Bharath", status: "active" }, warning: "The id field was intentionally omitted." });
  if (defect === "malformed-json") return new Response('{"data":{"id":"SIM-2003","status":"broken"}', { status: 200, headers: { "Content-Type": "application/json", "X-Simulated-Defect": "malformed-json" } });
  if (defect === "flaky-service" && attempt % 2 === 1) return Response.json({ error: "Service Unavailable", message: "This deterministic flaky service fails on odd-numbered attempts." }, { status: 503, headers: { "Retry-After": "2" } });
  if (defect === "duplicate-request") return Response.json({ error: "Duplicate transaction", message: "This idempotency key has already been processed.", idempotencyKey: "demo-key-1001" }, { status: 409 });

  return Response.json({ data: { id: "SIM-2000", status: "completed", amount: 2500, currency: "INR" }, message: "Healthy baseline response." });
}
