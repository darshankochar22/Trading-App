import { NextRequest, NextResponse } from "next/server";
import { fetchMutualFundMetrics } from "@/lib/nseMarket";
import type { MutualFundMetrics } from "@/types/market";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const codesRaw = request.nextUrl.searchParams.get("codes") ?? "";
  const codes = codesRaw
    .split(",")
    .map((c) => c.trim())
    .filter((c) => /^\d+$/.test(c))
    .slice(0, 30);

  if (!codes.length) {
    return NextResponse.json({ ok: true as const, data: {} as Record<string, MutualFundMetrics> });
  }

  const data: Record<string, MutualFundMetrics> = {};
  const batchSize = 5;
  for (let i = 0; i < codes.length; i += batchSize) {
    const chunk = codes.slice(i, i + batchSize);
    const settled = await Promise.allSettled(chunk.map((code) => fetchMutualFundMetrics(code)));
    settled.forEach((item, idx) => {
      if (item.status !== "fulfilled" || !item.value) return;
      data[chunk[idx]] = item.value;
    });
  }

  return NextResponse.json({ ok: true as const, data, asOf: new Date().toISOString() });
}

