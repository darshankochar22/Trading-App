import { NextRequest, NextResponse } from "next/server";
import { requireSessionUser } from "@/lib/auth";
import { getAutomationStatus, startAutomation, stopAutomation } from "@/lib/automationEngine";
import type { AutomationConfig } from "@/lib/automationEngine";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await requireSessionUser();
    const status = await getAutomationStatus(user.id);
    return NextResponse.json({ ok: true as const, data: status });
  } catch {
    return NextResponse.json({ ok: false as const, message: "Unauthenticated" }, { status: 401 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireSessionUser();
    let body: unknown = {};
    try {
      body = await request.json();
    } catch {
      body = {};
    }
    const result = startAutomation(user.id, body as Partial<AutomationConfig>);
    return NextResponse.json({ ok: true as const, ...result });
  } catch {
    return NextResponse.json({ ok: false as const, message: "Unauthenticated" }, { status: 401 });
  }
}

export async function DELETE() {
  try {
    const user = await requireSessionUser();
    const result = await stopAutomation(user.id);
    return NextResponse.json({ ok: true as const, ...result });
  } catch {
    return NextResponse.json({ ok: false as const, message: "Unauthenticated" }, { status: 401 });
  }
}

