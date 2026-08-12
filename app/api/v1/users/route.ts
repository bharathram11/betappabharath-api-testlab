import { hasValidBearerToken, unauthorizedResponse } from "../_auth";

type PracticeUser = { id: number; name: string; email: string; role: string; createdAt?: string };
const users: PracticeUser[] = [{ id: 101, name: "Aarav Mehta", email: "aarav@example.test", role: "QA Analyst" }, { id: 102, name: "Meera Iyer", email: "meera@example.test", role: "SDET" }, { id: 103, name: "Rohan Das", email: "rohan@example.test", role: "Automation Engineer" }];
let nextUserId = 104;
export async function GET(request: Request) { if (!await hasValidBearerToken(request)) return unauthorizedResponse(); return Response.json({ page: 1, per_page: 3, total: users.length, data: users }, { headers: { "Cache-Control": "no-store" } }); }
export async function POST(request: Request) { if (!await hasValidBearerToken(request)) return unauthorizedResponse(); try { const body = await request.json(); if (!body.name || !body.email) return Response.json({ error: "Validation failed", message: "name and email are required" }, { status: 400 }); const user = { id: nextUserId++, name: body.name, email: body.email, role: body.role ?? "Tester", createdAt: new Date().toISOString() }; users.push(user); return Response.json(user, { status: 201 }); } catch { return Response.json({ error: "Invalid JSON", message: "Send a valid JSON request body" }, { status: 400 }); } }
