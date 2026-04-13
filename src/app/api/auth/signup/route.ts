import { NextRequest, NextResponse } from "next/server";
import { jsonError } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";
import { hashPassword, newSessionExpiry, SESSION_COOKIE_NAME } from "@/lib/auth";

export const dynamic = "force-dynamic";

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON body.", 400, "INVALID_JSON");
  }
  const input = body as { email?: unknown; password?: unknown; name?: unknown };
  const email = typeof input.email === "string" ? input.email.trim().toLowerCase() : "";
  const password = typeof input.password === "string" ? input.password : "";
  const name = typeof input.name === "string" ? input.name.trim() : "";

  if (!isValidEmail(email)) return jsonError("Invalid email.", 422, "VALIDATION");
  if (password.length < 8) return jsonError("Password must be at least 8 characters.", 422, "VALIDATION");
  if (!name) return jsonError("Name is required.", 422, "VALIDATION");

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) return jsonError("Email already registered.", 409, "CONFLICT");

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: {
      email,
      name,
      passwordHash,
      profile: { create: { plan: "Paper Trading" } },
      account: { create: { cash: 1_000_000, startingCash: 1_000_000 } },
    },
  });

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

