import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ ok: true as const, user: null });
  }
  return NextResponse.json({
    ok: true as const,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      plan: user.profile?.plan ?? "Paper Trading",
    },
  });
}

