import { getSessionId, unauthorizedResponse } from "../../_auth";

type RouteContext = { params: Promise<{ code: string }> };

async function statusResponse(request: Request, { params }: RouteContext) {
  const session = await getSessionId(request);
  if (!session) return unauthorizedResponse();

  const { code } = await params;
  if (code === "403") {
    return Response.json({
      error: "Forbidden",
      message: "Your token is valid, but it does not have the admin:write scope required for this operation.",
      required_scope: "admin:write",
      token_scope: "users:read users:write",
    }, { status: 403 });
  }

  if (code === "405") {
    return Response.json({
      error: "Method Not Allowed",
      message: `${request.method} is not allowed for this resource. Use GET or POST.`,
    }, { status: 405, headers: { Allow: "GET, POST" } });
  }

  if (code === "415") {
    const contentType = request.headers.get("content-type") ?? "";
    if (!contentType.toLowerCase().includes("application/json")) {
      return Response.json({
        error: "Unsupported Media Type",
        message: "This endpoint accepts application/json. Change the Content-Type header and send valid JSON.",
        received: contentType || "No Content-Type header",
        accepted: ["application/json"],
      }, { status: 415, headers: { Accept: "application/json" } });
    }
    return Response.json({ message: "The JSON media type is supported." });
  }

  if (code === "429") {
    const retryAfter = 30;
    const resetAt = Math.floor(Date.now() / 1000) + retryAfter;
    return Response.json({
      error: "Too Many Requests",
      message: "The practice rate limit has been reached. Wait before retrying.",
      retry_after_seconds: retryAfter,
    }, { status: 429, headers: { "Retry-After": String(retryAfter), "X-RateLimit-Limit": "10", "X-RateLimit-Remaining": "0", "X-RateLimit-Reset": String(resetAt) } });
  }

  if (code === "503") {
    return Response.json({
      error: "Service Unavailable",
      message: "The banking service is temporarily in maintenance mode. Retry later.",
      maintenance: true,
    }, { status: 503, headers: { "Retry-After": "60" } });
  }

  return Response.json({ error: "Status simulation not found", supported: [403, 405, 415, 429, 503] }, { status: 404 });
}

export const GET = statusResponse;
export const POST = statusResponse;
export const PUT = statusResponse;
