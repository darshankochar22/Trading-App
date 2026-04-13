import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { SESSION_COOKIE_NAME } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE_NAME)?.value ?? "";
  if (token) {
    await prisma.session.delete({ where: { token } }).catch(() => {});
  }
  const res = NextResponse.json({ ok: true as const });
  res.cookies.set(SESSION_COOKIE_NAME, "", { httpOnly: true, path: "/", expires: new Date(0) });
  return res;
}

