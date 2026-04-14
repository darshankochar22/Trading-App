export type Candle = {
  openTime: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

export type BacktestTrade = {
  entryTime: number;
  exitTime: number;
  entryPrice: number;
  exitPrice: number;
  qty: number;
  pnl: number;
  pnlPct: number;
};

export type EquityPoint = {
  time: number;
  equity: number;
};

export type BacktestSummary = {
  initialCapital: number;
  finalCapital: number;
  netPnl: number;
  netPnlPct: number;
  maxDrawdownPct: number;
  winRatePct: number;
  totalTrades: number;
  avgTradePct: number;
  benchmarkReturnPct: number;
  sharpeLike: number;
  profitFactor: number;
};

export type BacktestResult = {
  summary: BacktestSummary;
  trades: BacktestTrade[];
  equityCurve: EquityPoint[];
};

function sma(values: number[], period: number): Array<number | null> {
  const out: Array<number | null> = Array(values.length).fill(null);
  if (period <= 1) return values.map((v) => v);
  let sum = 0;
  for (let i = 0; i < values.length; i += 1) {
    sum += values[i];
    if (i >= period) sum -= values[i - period];
    if (i >= period - 1) out[i] = sum / period;
  }
  return out;
}

function maxDrawdownPct(equityCurve: EquityPoint[]): number {
  if (!equityCurve.length) return 0;
  let peak = equityCurve[0].equity;
  let maxDd = 0;
  for (const p of equityCurve) {
    if (p.equity > peak) peak = p.equity;
    const dd = peak > 0 ? ((peak - p.equity) / peak) * 100 : 0;
    if (dd > maxDd) maxDd = dd;
  }
  return maxDd;
}

function stdev(values: number[]) {
  if (values.length < 2) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance =
    values.reduce((acc, v) => acc + (v - mean) ** 2, 0) / (values.length - 1);
  return Math.sqrt(variance);
}

export function runSmaCrossoverBacktest(params: {
  candles: Candle[];
  fastPeriod: number;
  slowPeriod: number;
  initialCapital?: number;
}): BacktestResult {
  const { candles, fastPeriod, slowPeriod } = params;
  const initialCapital = params.initialCapital ?? 100000;

  if (!candles.length || fastPeriod >= slowPeriod) {
    return {
      summary: {
        initialCapital,
        finalCapital: initialCapital,
        netPnl: 0,
        netPnlPct: 0,
        maxDrawdownPct: 0,
        winRatePct: 0,
        totalTrades: 0,
        avgTradePct: 0,
        benchmarkReturnPct: 0,
        sharpeLike: 0,
        profitFactor: 0,
      },
      trades: [],
      equityCurve: candles.map((c) => ({ time: c.openTime, equity: initialCapital })),
    };
  }

  const closes = candles.map((c) => c.close);
  const fast = sma(closes, fastPeriod);
  const slow = sma(closes, slowPeriod);

  let capital = initialCapital;
  let positionQty = 0;
  let entryPrice = 0;
  let entryTime = 0;
  const trades: BacktestTrade[] = [];
  const equityCurve: EquityPoint[] = [];

  for (let i = 1; i < candles.length; i += 1) {
    const c = candles[i];
    const prevFast = fast[i - 1];
    const prevSlow = slow[i - 1];
    const curFast = fast[i];
    const curSlow = slow[i];

    if (
      prevFast !== null &&
      prevSlow !== null &&
      curFast !== null &&
      curSlow !== null
    ) {
      const crossedUp = prevFast <= prevSlow && curFast > curSlow;
      const crossedDown = prevFast >= prevSlow && curFast < curSlow;

      if (crossedUp && positionQty === 0) {
        positionQty = capital / c.close;
        entryPrice = c.close;
        entryTime = c.openTime;
        capital = 0;
      } else if (crossedDown && positionQty > 0) {
        const proceeds = positionQty * c.close;
        const entryValue = positionQty * entryPrice;
        const pnl = proceeds - entryValue;
        const pnlPct = entryValue > 0 ? (pnl / entryValue) * 100 : 0;
        trades.push({
          entryTime,
          exitTime: c.openTime,
          entryPrice,
          exitPrice: c.close,
          qty: positionQty,
          pnl,
          pnlPct,
        });
        capital = proceeds;
        positionQty = 0;
      }
    }

    const equity = positionQty > 0 ? positionQty * c.close : capital;
    equityCurve.push({ time: c.openTime, equity });
  }

  if (positionQty > 0) {
    const last = candles[candles.length - 1];
    const proceeds = positionQty * last.close;
    const entryValue = positionQty * entryPrice;
    const pnl = proceeds - entryValue;
    const pnlPct = entryValue > 0 ? (pnl / entryValue) * 100 : 0;
    trades.push({
      entryTime,
      exitTime: last.openTime,
      entryPrice,
      exitPrice: last.close,
      qty: positionQty,
      pnl,
      pnlPct,
    });
    capital = proceeds;
  }

  const finalCapital = capital;
  const netPnl = finalCapital - initialCapital;
  const wins = trades.filter((t) => t.pnl > 0).length;
  const winRatePct = trades.length ? (wins / trades.length) * 100 : 0;
  const avgTradePct = trades.length
    ? trades.reduce((acc, t) => acc + t.pnlPct, 0) / trades.length
    : 0;
  const grossProfit = trades
    .filter((t) => t.pnl > 0)
    .reduce((acc, t) => acc + t.pnl, 0);
  const grossLoss = Math.abs(
    trades.filter((t) => t.pnl < 0).reduce((acc, t) => acc + t.pnl, 0),
  );
  const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? 99 : 0;
  const benchmarkReturnPct =
    candles.length > 1
      ? ((candles[candles.length - 1].close - candles[0].close) / candles[0].close) * 100
      : 0;
  const tradeReturns = trades.map((t) => t.pnlPct / 100);
  const returnsVol = stdev(tradeReturns);
  const meanTradeReturn =
    tradeReturns.length > 0
      ? tradeReturns.reduce((a, b) => a + b, 0) / tradeReturns.length
      : 0;
  const sharpeLike = returnsVol > 0 ? meanTradeReturn / returnsVol : 0;

  return {
    summary: {
      initialCapital,
      finalCapital,
      netPnl,
      netPnlPct: initialCapital > 0 ? (netPnl / initialCapital) * 100 : 0,
      maxDrawdownPct: maxDrawdownPct(equityCurve),
      winRatePct,
      totalTrades: trades.length,
      avgTradePct,
      benchmarkReturnPct,
      sharpeLike,
      profitFactor,
    },
    trades,
    equityCurve,
  };
}
