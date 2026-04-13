import { NextResponse } from "next/server";
import { requireSessionUser } from "@/lib/auth";
import { runAutomationCycle } from "@/lib/automationEngine";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const user = await requireSessionUser();
    const result = await runAutomationCycle(user.id);
    return NextResponse.json(result, { status: result.ok ? 200 : 500 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Request failed";
    if (message.toLowerCase().includes("unauth")) {
      return NextResponse.json({ ok: false as const, message: "Unauthenticated" }, { status: 401 });
    }
    return NextResponse.json({ ok: false as const, message }, { status: 500 });
  }
}

