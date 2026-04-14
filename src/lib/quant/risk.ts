import type { Holding, PortfolioSnapshot } from "@/types/trading";

export type RiskSnapshot = {
  grossExposure: number;
  cashRatioPct: number;
  concentrationTop1Pct: number;
  concentrationTop3Pct: number;
  estimatedVar95Pct: number;
  estimatedVar95Amount: number;
  stress5PctLoss: number;
  stress10PctLoss: number;
  stress15PctLoss: number;
};

function sum(nums: number[]) {
  return nums.reduce((acc, v) => acc + v, 0);
}

function stdDev(values: number[]) {
  if (values.length < 2) return 0;
  const mean = sum(values) / values.length;
  const variance = sum(values.map((v) => (v - mean) ** 2)) / (values.length - 1);
  return Math.sqrt(variance);
}

function concentration(holdings: Holding[], topN: number, totalExposure: number) {
  if (!totalExposure) return 0;
  const sorted = [...holdings].sort((a, b) => b.currentValue - a.currentValue);
  const top = sum(sorted.slice(0, topN).map((h) => h.currentValue));
  return (top / totalExposure) * 100;
}

export function buildRiskSnapshot(params: {
  portfolio: PortfolioSnapshot | null;
  recentTradeReturnsPct: number[];
}): RiskSnapshot {
  const p = params.portfolio;
  const grossExposure = p?.currentValue ?? 0;
  const cash = p?.cash ?? 0;
  const totalCapital = grossExposure + cash;

  const returnsStd = stdDev(params.recentTradeReturnsPct);
  const assumedDailyVolPct = Math.max(returnsStd, 1.2); // fallback assumption if sparse trades
  const estimatedVar95Pct = 1.65 * assumedDailyVolPct;
  const estimatedVar95Amount = (grossExposure * estimatedVar95Pct) / 100;

  return {
    grossExposure,
    cashRatioPct: totalCapital > 0 ? (cash / totalCapital) * 100 : 0,
    concentrationTop1Pct: concentration(p?.holdings ?? [], 1, grossExposure),
    concentrationTop3Pct: concentration(p?.holdings ?? [], 3, grossExposure),
    estimatedVar95Pct,
    estimatedVar95Amount,
    stress5PctLoss: grossExposure * 0.05,
    stress10PctLoss: grossExposure * 0.1,
    stress15PctLoss: grossExposure * 0.15,
  };
}
