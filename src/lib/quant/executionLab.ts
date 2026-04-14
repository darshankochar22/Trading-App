import type { Candle } from "@/lib/quant/strategyLab";

export type ExecutionSlice = {
  time: number;
  marketPrice: number;
  qty: number;
  fillPrice: number;
  notional: number;
};

export type ExecutionPlanResult = {
  slices: ExecutionSlice[];
  avgFillPrice: number;
  benchmarkPrice: number;
  slippagePct: number;
  estimatedCost: number;
};

export function simulateExecutionPlan(params: {
  candles: Candle[];
  totalQty: number;
  slices: number;
  side: "BUY" | "SELL";
  aggressivenessBps: number;
}): ExecutionPlanResult {
  const { candles, totalQty, slices, side, aggressivenessBps } = params;
  const src = candles.slice(-Math.max(slices * 3, slices));
  if (!src.length || totalQty <= 0 || slices <= 0) {
    return {
      slices: [],
      avgFillPrice: 0,
      benchmarkPrice: 0,
      slippagePct: 0,
      estimatedCost: 0,
    };
  }

  const picked = src.filter((_, i) => i % Math.max(Math.floor(src.length / slices), 1)).slice(0, slices);
  const qtyPerSlice = totalQty / picked.length;
  const direction = side === "BUY" ? 1 : -1;

  const out = picked.map((c) => {
    const marketPrice = c.close;
    const impact = marketPrice * ((aggressivenessBps / 10000) * direction);
    const fillPrice = marketPrice + impact;
    const notional = fillPrice * qtyPerSlice;
    return {
      time: c.openTime,
      marketPrice,
      qty: qtyPerSlice,
      fillPrice,
      notional,
    };
  });

  const totalNotional = out.reduce((acc, s) => acc + s.notional, 0);
  const totalQtyDone = out.reduce((acc, s) => acc + s.qty, 0);
  const avgFillPrice = totalQtyDone > 0 ? totalNotional / totalQtyDone : 0;
  const benchmarkPrice = picked.reduce((acc, c) => acc + c.close, 0) / picked.length;
  const slippagePct =
    benchmarkPrice > 0
      ? ((avgFillPrice - benchmarkPrice) / benchmarkPrice) * 100 * direction
      : 0;

  return {
    slices: out,
    avgFillPrice,
    benchmarkPrice,
    slippagePct,
    estimatedCost: totalNotional,
  };
}
