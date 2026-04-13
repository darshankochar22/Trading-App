import { NextRequest, NextResponse } from "next/server";
import { jsonError } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";
import { isValidSymbol, normalizeSymbol } from "@/lib/validation/symbol";
import { requireSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  let user;
  try {
    user = await requireSessionUser();
  } catch {
    return NextResponse.json({ ok: false as const, message: "Unauthenticated" }, { status: 401 });
  }
  const alerts = await prisma.priceAlert.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ ok: true as const, data: alerts });
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

  const input = body as { symbol?: unknown; targetPrice?: unknown; direction?: unknown };
  const symbol = normalizeSymbol(typeof input.symbol === "string" ? input.symbol : "");
  const targetPrice = Number(input.targetPrice);
  const direction = input.direction === "BELOW" ? "BELOW" : "ABOVE";
  if (!isValidSymbol(symbol)) {
    return jsonError("Invalid symbol.", 422, "VALIDATION");
  }
  if (!Number.isFinite(targetPrice) || targetPrice <= 0) {
    return jsonError("targetPrice must be a positive number.", 422, "VALIDATION");
  }

  const alert = await prisma.priceAlert.create({
    data: {
      userId: user.id,
      symbol,
      targetPrice,
      direction,
      isActive: true,
    },
  });
  return NextResponse.json({ ok: true as const, data: alert }, { status: 201 });
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
  const input = body as { id?: unknown; isActive?: unknown };
  const id = typeof input.id === "string" ? input.id : "";
  const isActive = Boolean(input.isActive);
  if (!id) {
    return jsonError("id is required.", 422, "VALIDATION");
  }
  const updated = await prisma.priceAlert.updateMany({
    where: { id, userId: user.id },
    data: { isActive },
  });
  if (!updated.count) {
    return jsonError("Alert not found.", 404, "NOT_FOUND");
  }
  return NextResponse.json({ ok: true as const });
}

export async function DELETE(request: NextRequest) {
  let user;
  try {
    user = await requireSessionUser();
  } catch {
    return NextResponse.json({ ok: false as const, message: "Unauthenticated" }, { status: 401 });
  }
  const id = request.nextUrl.searchParams.get("id") ?? "";
  if (!id) {
    return jsonError("id is required.", 422, "VALIDATION");
  }
  await prisma.priceAlert.deleteMany({ where: { id, userId: user.id } });
  return NextResponse.json({ ok: true as const });
}

