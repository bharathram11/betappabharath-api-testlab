import { issueAccessToken } from "../../_auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body.email || !body.password) {
      return Response.json(
        { error: "Validation failed", message: "email and password are required" },
        { status: 400 },
      );
    }

    const requestedExpiresIn = Number(body.expires_in ?? 3600);
    const { accessToken, expiresIn, expiresAt } = await issueAccessToken(String(body.email), requestedExpiresIn);
    return Response.json(
      {
        access_token: accessToken,
        token_type: "Bearer",
        expires_in: expiresIn,
        expires_in_minutes: expiresIn / 60,
        expires_at: new Date(expiresAt).toISOString(),
        scope: "users:read users:write",
      },
      { status: 201, headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return Response.json({ error: "Invalid JSON", message: "Send a valid JSON request body" }, { status: 400 });
  }
}
