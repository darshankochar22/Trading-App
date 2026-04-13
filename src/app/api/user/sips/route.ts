import { NextRequest, NextResponse } from "next/server";
import { jsonError } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";
import { requireSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await requireSessionUser();
    const data = await prisma.sipPlan.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ ok: true as const, data });
  } catch {
    return NextResponse.json({ ok: false as const, message: "Unauthenticated" }, { status: 401 });
  }
}

export async function POST(request: NextRequest) {
  let user;
  try {
    user = await requireSessionUser();
  } catch {
    return NextResponse.json({ ok: false as const, message: "Unauthenticated" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON body.", 400, "INVALID_JSON");
  }

  const input = body as {
    fundCode?: unknown;
    fundName?: unknown;
    monthlyAmount?: unknown;
    expectedAnnualReturn?: unknown;
    dayOfMonth?: unknown;
    startDate?: unknown;
  };

  const fundCode = typeof input.fundCode === "string" ? input.fundCode.trim() : "";
  const fundName = typeof input.fundName === "string" ? input.fundName.trim() : "";
  const monthlyAmount = Number(input.monthlyAmount);
  const expectedAnnualReturn = Number(input.expectedAnnualReturn);
  const dayOfMonth = Number(input.dayOfMonth);
  const startDate = typeof input.startDate === "string" ? new Date(input.startDate) : new Date();

  if (!fundCode || !fundName) return jsonError("fundCode and fundName are required.", 422, "VALIDATION");
  if (!Number.isFinite(monthlyAmount) || monthlyAmount <= 0) return jsonError("monthlyAmount must be positive.", 422, "VALIDATION");
  if (!Number.isFinite(expectedAnnualReturn) || expectedAnnualReturn < 0) return jsonError("expectedAnnualReturn must be >= 0.", 422, "VALIDATION");
  if (!Number.isFinite(dayOfMonth) || dayOfMonth < 1 || dayOfMonth > 28) return jsonError("dayOfMonth must be between 1 and 28.", 422, "VALIDATION");
  if (Number.isNaN(startDate.getTime())) return jsonError("Invalid startDate.", 422, "VALIDATION");

  const data = await prisma.sipPlan.create({
    data: {
      userId: user.id,
      fundCode,
      fundName,
      monthlyAmount,
      expectedAnnualReturn,
      dayOfMonth,
      startDate,
      status: "ACTIVE",
    },
  });
  return NextResponse.json({ ok: true as const, data }, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  let user;
  try {
    user = await requireSessionUser();
  } catch {
    return NextResponse.json({ ok: false as const, message: "Unauthenticated" }, { status: 401 });
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON body.", 400, "INVALID_JSON");
  }
  const input = body as { id?: unknown; status?: unknown };
  const id = typeof input.id === "string" ? input.id : "";
  const status = input.status === "PAUSED" ? "PAUSED" : "ACTIVE";
  if (!id) return jsonError("id is required.", 422, "VALIDATION");

  const updated = await prisma.sipPlan.updateMany({
    where: { id, userId: user.id },
    data: { status },
  });
  if (!updated.count) return jsonError("SIP plan not found.", 404, "NOT_FOUND");
  return NextResponse.json({ ok: true as const });
}

