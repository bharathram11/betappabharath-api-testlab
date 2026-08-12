import { hasValidBearerToken, unauthorizedResponse } from "../../_auth";

export async function GET(request: Request) { if (!await hasValidBearerToken(request)) return unauthorizedResponse(); return Response.json({ data: { id: 1, name: "Practice Tester", plan: "sandbox" } }); }
