import { NextRequest, NextResponse } from "next/server";
import { jsonError } from "@/lib/api/response";
import { clientKey, isRateLimited } from "@/lib/api/rateLimit";
import { requireSessionUser } from "@/lib/auth";
import { cancelOrderDb } from "@/lib/tradingDb";

export const dynamic = "force-dynamic";

const WINDOW_MS = 60_000;
const MAX = 40;

export async function POST(request: NextRequest) {
  if (isRateLimited(clientKey(request, "orders-cancel"), MAX, WINDOW_MS)) {
    return jsonError("Too many requests. Try again shortly.", 429, "RATE_LIMIT");
  }
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

  const orderId =
    body && typeof body === "object" && "orderId" in body && typeof (body as { orderId?: unknown }).orderId === "string"
      ? (body as { orderId: string }).orderId.trim()
      : "";

  if (!orderId) {
    return jsonError("orderId is required.", 422, "VALIDATION");
  }

  try {
    const data = await cancelOrderDb(user.id, orderId);
    return NextResponse.json({ ok: true as const, data });
  } catch (error) {
    return NextResponse.json(
      { ok: false as const, message: error instanceof Error ? error.message : "Failed to cancel order" },
      { status: 400 },
    );
  }
}
