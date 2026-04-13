import { NextRequest, NextResponse } from "next/server";
import { jsonError } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";
import { newSessionExpiry, SESSION_COOKIE_NAME, verifyPassword } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON body.", 400, "INVALID_JSON");
  }
  const input = body as { email?: unknown; password?: unknown };
  const email = typeof input.email === "string" ? input.email.trim().toLowerCase() : "";
  const password = typeof input.password === "string" ? input.password : "";
  if (!email || !password) return jsonError("Email and password are required.", 422, "VALIDATION");

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return jsonError("Invalid credentials.", 401, "AUTH");
  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) return jsonError("Invalid credentials.", 401, "AUTH");

  const token = crypto.randomUUID();
  const expiresAt = newSessionExpiry();
  await prisma.session.create({ data: { token, userId: user.id, expiresAt } });

  const res = NextResponse.json({ ok: true as const });
  res.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
  return res;
}

