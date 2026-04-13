import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ ok: false as const, message: "Unauthenticated" }, { status: 401 });
  }
  const [activeAlerts, ordersCount, tradesCount, holdingsCount] = await Promise.all([
    prisma.priceAlert.count({ where: { userId: user.id, isActive: true } }),
    prisma.tradeOrder.count({ where: { userId: user.id } }),
    prisma.executedTrade.count({ where: { userId: user.id } }),
    prisma.holding.count({ where: { userId: user.id } }),
  ]);

  return NextResponse.json({
    ok: true as const,
    data: {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        plan: user.profile?.plan ?? "Paper Trading",
      },
      account: {
        cash: user.account?.cash ?? 0,
        startingCash: user.account?.startingCash ?? 0,
      },
      stats: {
        activeAlerts,
        ordersCount,
        tradesCount,
        holdingsCount,
      },
    },
    asOf: new Date().toISOString(),
  });
}

