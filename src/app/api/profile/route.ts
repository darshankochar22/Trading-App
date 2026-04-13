import { NextResponse } from "next/server";
import { fetchNseEquitySnapshot } from "@/lib/nseMarket";
import { requireSessionUser } from "@/lib/auth";
import { getPortfolioDb, getTradingStatsDb, listHoldingSymbolsDb } from "@/lib/tradingDb";
import type { MarketStock } from "@/types/market";

export const dynamic = "force-dynamic";

const SNAPSHOT_BATCH = 8;

export async function GET() {
  try {
    const user = await requireSessionUser();
    const symbols = await listHoldingSymbolsDb(user.id);
    const map = new Map<string, MarketStock>();
    for (let i = 0; i < symbols.length; i += SNAPSHOT_BATCH) {
      const slice = symbols.slice(i, i + SNAPSHOT_BATCH);
      const settled = await Promise.allSettled(slice.map((sym) => fetchNseEquitySnapshot(sym)));
      for (const r of settled) {
        if (r.status === "fulfilled") {
          const stock = r.value;
          map.set(stock.symbol, stock);
        }
      }
    }

    const portfolio = await getPortfolioDb(user.id, map);
    const stats = await getTradingStatsDb(user.id);
    const profile = {
      name: user.name,
      email: user.email,
      plan: user.profile?.plan ?? "Paper Trading",
    } as const;

    return NextResponse.json({
      ok: true as const,
      data: {
        profile,
        portfolio,
        stats,
      },
      asOf: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false as const,
        message: error instanceof Error ? error.message : "Failed to load profile",
      },
      { status: error instanceof Error && error.message === "UNAUTHENTICATED" ? 401 : 500 },
    );
  }
}

