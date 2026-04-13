import { NextResponse } from "next/server";
import { requireSessionUser } from "@/lib/auth";
import { fetchNseOverviewCached } from "@/lib/nseMarket";
import { getPortfolioDb, getTradingStatsDb, listTradesDb } from "@/lib/tradingDb";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await requireSessionUser();
    const [overview, stats, trades] = await Promise.all([fetchNseOverviewCached(), getTradingStatsDb(user.id), listTradesDb(user.id)]);
    const map = new Map(overview.stocks.map((s) => [s.symbol, s]));
    const portfolio = await getPortfolioDb(user.id, map);

    return NextResponse.json({
      ok: true as const,
      data: {
        asOf: new Date().toISOString(),
        cash: stats.cash,
        startingCash: stats.startingCash,
        netPnl: portfolio.netPnl,
        realizedPnl: portfolio.realizedPnl,
        unrealizedPnl: portfolio.unrealizedPnl,
        totalOrders: stats.orders.total,
        totalTrades: trades.length,
        latestTrades: trades.slice(0, 10),
      },
    });
  } catch {
    return NextResponse.json({ ok: false as const, message: "Unauthenticated" }, { status: 401 });
  }
}

