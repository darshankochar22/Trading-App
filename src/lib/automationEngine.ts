import { fetchNseEquitySnapshot } from "@/lib/nseMarket";
import { prisma } from "@/lib/prisma";
import { getPortfolioDb, placeOrderDb } from "@/lib/tradingDb";
import type { MarketStock } from "@/types/market";

export type AutomationConfig = {
  symbols: string[];
  intervalSec: number;
  buyTriggerPct: number;
  sellTriggerPct: number;
  maxPositionPerSymbol: number;
  maxDailyLoss: number;
  tradeQty: number;
  adaptiveMode: boolean;
  targetTradesPerCycle: number;
  volatilityLookback: number;
};

export type AutomationStatus = {
  running: boolean;
  config: AutomationConfig | null;
  startedAt: string | null;
  lastRunAt: string | null;
  cycles: number;
  ordersPlaced: number;
  lastMessage: string;
  recentEvents: AutomationEvent[];
  lastDiagnostics: Array<{
    symbol: string;
    lastPrice: number;
    movePct: number;
    source: "tick" | "day";
    action: "BUY" | "SELL" | "SKIP";
    reason: string;
  }>;
};

export type AutomationEvent = {
  id: string;
  at: string;
  symbol: string;
  side: "BUY" | "SELL";
  quantity: number;
  price: number;
  movePct: number;
  reason: string;
};

type EngineInstance = {
  timer: ReturnType<typeof setInterval> | null;
  runningCycle: boolean;
  config: AutomationConfig;
  baseConfig: AutomationConfig;
  startedAt: Date;
  lastRunAt: Date | null;
  cycles: number;
  ordersPlaced: number;
  lastMessage: string;
  prevPrices: Map<string, number>;
  recentEvents: AutomationEvent[];
  lastDiagnostics: Array<{
    symbol: string;
    lastPrice: number;
    movePct: number;
    source: "tick" | "day";
    action: "BUY" | "SELL" | "SKIP";
    reason: string;
  }>;
  recentMoveAbs: number[];
  recentCycleOrders: number[];
};

export type AutomationStopResult = {
  status: "stopped" | "not_running";
  settlement?: {
    soldPositions: number;
    failed: Array<{ symbol: string; quantity: number; reason: string }>;
    portfolio: {
      cash: number;
      invested: number;
      currentValue: number;
      netPnl: number;
      realizedPnl: number;
      unrealizedPnl: number;
    };
  };
};

const DEFAULT_CONFIG: AutomationConfig = {
  symbols: ["RELIANCE", "TCS", "HDFCBANK", "INFY", "ICICIBANK"],
  intervalSec: 300,
  buyTriggerPct: 0.25,
  sellTriggerPct: -0.25,
  maxPositionPerSymbol: 20,
  maxDailyLoss: 5000,
  tradeQty: 1,
  adaptiveMode: true,
  targetTradesPerCycle: 2,
  volatilityLookback: 24,
};

const engines = new Map<string, EngineInstance>();

function cleanConfig(input?: Partial<AutomationConfig>): AutomationConfig {
  const symbols = (input?.symbols ?? DEFAULT_CONFIG.symbols)
    .map((s) => s.trim().toUpperCase())
    .filter((s) => /^[A-Z0-9\-&]+$/.test(s))
    .slice(0, 12);
  return {
    symbols: symbols.length ? symbols : DEFAULT_CONFIG.symbols,
    // Fixed automation cadence: always run every 300 seconds.
    intervalSec: 300,
    buyTriggerPct: Math.min(3, Math.max(0.05, Number(input?.buyTriggerPct ?? DEFAULT_CONFIG.buyTriggerPct))),
    sellTriggerPct: Math.max(-3, Math.min(-0.05, Number(input?.sellTriggerPct ?? DEFAULT_CONFIG.sellTriggerPct))),
    maxPositionPerSymbol: Math.min(500, Math.max(1, Math.floor(input?.maxPositionPerSymbol ?? DEFAULT_CONFIG.maxPositionPerSymbol))),
    maxDailyLoss: Math.min(200000, Math.max(500, Number(input?.maxDailyLoss ?? DEFAULT_CONFIG.maxDailyLoss))),
    tradeQty: Math.min(50, Math.max(1, Math.floor(input?.tradeQty ?? DEFAULT_CONFIG.tradeQty))),
    adaptiveMode: input?.adaptiveMode ?? DEFAULT_CONFIG.adaptiveMode,
    targetTradesPerCycle: Math.min(8, Math.max(1, Math.floor(input?.targetTradesPerCycle ?? DEFAULT_CONFIG.targetTradesPerCycle))),
    volatilityLookback: Math.min(80, Math.max(8, Math.floor(input?.volatilityLookback ?? DEFAULT_CONFIG.volatilityLookback))),
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function avg(values: number[]) {
  if (!values.length) return 0;
  return values.reduce((acc, v) => acc + v, 0) / values.length;
}

function applyAdaptiveParams(engine: EngineInstance, netPnl: number, cycleMoveAbs: number[]) {
  if (!engine.config.adaptiveMode) return;
  const base = engine.baseConfig;
  const lookback = engine.config.volatilityLookback;
  const mergedMoves = [...cycleMoveAbs, ...engine.recentMoveAbs].slice(0, lookback);
  const realizedVol = avg(mergedMoves);
  const baseTrigger = Math.max(0.05, Math.abs(base.buyTriggerPct));
  const volFactor = clamp(realizedVol > 0 ? realizedVol / baseTrigger : 1, 0.6, 2.2);
  const drawdownRatio = clamp(Math.abs(Math.min(0, netPnl)) / Math.max(1, base.maxDailyLoss), 0, 1);
  const aggression = 1 - drawdownRatio * 0.55;
  const targetOrders = Math.max(1, engine.config.targetTradesPerCycle);
  const recentOrders = avg(engine.recentCycleOrders.slice(0, lookback));
  const throughputFactor = clamp(targetOrders / Math.max(0.5, recentOrders || targetOrders), 0.75, 1.35);

  const nextBuyRaw = clamp(baseTrigger * volFactor * (1 / Math.max(0.65, throughputFactor)) * (1 / Math.max(0.5, aggression)), 0.05, 3);
  const nextBuy = clamp(engine.config.buyTriggerPct * 0.7 + nextBuyRaw * 0.3, 0.05, 3);
  const nextSell = -nextBuy;

  const qtyFromRisk = clamp(base.tradeQty * aggression * throughputFactor * (1 / volFactor), 1, 50);
  const nextQty = Math.max(1, Math.round(engine.config.tradeQty * 0.6 + qtyFromRisk * 0.4));

  engine.config.buyTriggerPct = Number(nextBuy.toFixed(3));
  engine.config.sellTriggerPct = Number(nextSell.toFixed(3));
  engine.config.tradeQty = nextQty;
}

async function buildMarketMap(symbols: string[]) {
  const uniqueSymbols = [...new Set(symbols)];
  const settled = await Promise.allSettled(uniqueSymbols.map((s) => fetchNseEquitySnapshot(s)));
  const map = new Map<string, MarketStock>();
  for (const item of settled) {
    if (item.status !== "fulfilled") continue;
    map.set(item.value.symbol, item.value);
  }
  return map;
}

export async function runAutomationCycle(userId: string) {
  const engine = engines.get(userId);
  if (!engine) {
    return { ok: false as const, message: "Automation engine is not running." };
  }
  if (engine.runningCycle) {
    return { ok: false as const, message: "Previous cycle is still running." };
  }
  engine.runningCycle = true;
  try {
  const marketMap = await buildMarketMap(engine.config.symbols);
  if (!marketMap.size) {
    engine.lastMessage = "No market quotes available for configured symbols.";
    engine.lastRunAt = new Date();
    return { ok: false as const, message: engine.lastMessage };
  }

  const account = await prisma.account.findUnique({ where: { userId }, select: { userId: true } });
  if (!account) {
    engine.lastMessage = "Account not found.";
    return { ok: false as const, message: engine.lastMessage };
  }

  const portfolio = await getPortfolioDb(userId, marketMap);
  const cycleMoveAbs: number[] = [];
  const netPnl = portfolio.netPnl ?? 0;
  if (netPnl <= -Math.abs(engine.config.maxDailyLoss)) {
    engine.lastMessage = `Loss guard active. Net P&L ${netPnl.toFixed(2)} breached -${engine.config.maxDailyLoss.toFixed(2)}.`;
    engine.lastRunAt = new Date();
    engine.cycles += 1;
    return { ok: true as const, message: engine.lastMessage, actions: [] as string[] };
  }

  const holdings = await prisma.holding.findMany({ where: { userId }, select: { symbol: true, quantity: true } });
  const holdingBySymbol = new Map(holdings.map((h) => [h.symbol, h.quantity]));

  const actions: string[] = [];
  const cycleEvents: AutomationEvent[] = [];
  const diagnostics: EngineInstance["lastDiagnostics"] = [];
  for (const [symbol, quote] of marketMap.entries()) {
    const lastPrice = quote.lastPrice;
    if (!Number.isFinite(lastPrice) || lastPrice <= 0) continue;
    const prev = engine.prevPrices.get(symbol);
    engine.prevPrices.set(symbol, lastPrice);
    const usingDayFallback = !prev || prev <= 0;
    const movePct = usingDayFallback ? (Number.isFinite(quote.pChange) ? quote.pChange : 0) : ((lastPrice - prev) / prev) * 100;
    cycleMoveAbs.push(Math.abs(movePct));
    const heldQty = holdingBySymbol.get(symbol) ?? 0;

    if (actions.length >= engine.config.targetTradesPerCycle) {
      diagnostics.push({
        symbol,
        lastPrice,
        movePct,
        source: usingDayFallback ? "day" : "tick",
        action: "SKIP",
        reason: "Cycle order cap reached",
      });
      continue;
    }

    if (movePct >= engine.config.buyTriggerPct && heldQty < engine.config.maxPositionPerSymbol) {
      try {
        await placeOrderDb({
          userId,
          symbol,
          side: "BUY",
          quantity: engine.config.tradeQty,
          orderType: "MARKET",
          marketMap,
        });
        engine.ordersPlaced += 1;
        actions.push(`BUY ${engine.config.tradeQty} ${symbol} (${movePct.toFixed(2)}%)`);
        cycleEvents.push({
          id: `${Date.now()}-${symbol}-BUY-${Math.random().toString(36).slice(2, 7)}`,
          at: new Date().toISOString(),
          symbol,
          side: "BUY",
          quantity: engine.config.tradeQty,
          price: lastPrice,
          movePct,
          reason: `Momentum up >= ${engine.config.buyTriggerPct}%`,
        });
        diagnostics.push({
          symbol,
          lastPrice,
          movePct,
          source: usingDayFallback ? "day" : "tick",
          action: "BUY",
          reason: usingDayFallback ? "Bootstrap from day % move" : "Tick momentum trigger",
        });
      } catch {
        diagnostics.push({
          symbol,
          lastPrice,
          movePct,
          source: usingDayFallback ? "day" : "tick",
          action: "SKIP",
          reason: "BUY rejected by risk/cash/order validation",
        });
        // Ignore per-symbol failures to keep the loop alive.
      }
      continue;
    }

    if (movePct <= engine.config.sellTriggerPct && heldQty >= engine.config.tradeQty) {
      try {
        await placeOrderDb({
          userId,
          symbol,
          side: "SELL",
          quantity: engine.config.tradeQty,
          orderType: "MARKET",
          marketMap,
        });
        engine.ordersPlaced += 1;
        actions.push(`SELL ${engine.config.tradeQty} ${symbol} (${movePct.toFixed(2)}%)`);
        cycleEvents.push({
          id: `${Date.now()}-${symbol}-SELL-${Math.random().toString(36).slice(2, 7)}`,
          at: new Date().toISOString(),
          symbol,
          side: "SELL",
          quantity: engine.config.tradeQty,
          price: lastPrice,
          movePct,
          reason: `Momentum down <= ${engine.config.sellTriggerPct}%`,
        });
        diagnostics.push({
          symbol,
          lastPrice,
          movePct,
          source: usingDayFallback ? "day" : "tick",
          action: "SELL",
          reason: usingDayFallback ? "Bootstrap from day % move" : "Tick momentum trigger",
        });
      } catch {
        diagnostics.push({
          symbol,
          lastPrice,
          movePct,
          source: usingDayFallback ? "day" : "tick",
          action: "SKIP",
          reason: "SELL rejected by holdings/order validation",
        });
        // Ignore per-symbol failures to keep the loop alive.
      }
      continue;
    }

    diagnostics.push({
      symbol,
      lastPrice,
      movePct,
      source: usingDayFallback ? "day" : "tick",
      action: "SKIP",
      reason:
        heldQty >= engine.config.maxPositionPerSymbol
          ? "Max position reached"
          : movePct > engine.config.sellTriggerPct && heldQty < engine.config.tradeQty
            ? "No holdings to sell"
            : "Move below buy trigger / above sell trigger",
    });
  }

  engine.lastRunAt = new Date();
  engine.cycles += 1;
  applyAdaptiveParams(engine, netPnl, cycleMoveAbs);
  engine.recentMoveAbs = [...cycleMoveAbs, ...engine.recentMoveAbs].slice(0, engine.config.volatilityLookback);
  engine.recentCycleOrders = [actions.length, ...engine.recentCycleOrders].slice(0, engine.config.volatilityLookback);
  if (cycleEvents.length) {
    engine.recentEvents = [...cycleEvents, ...engine.recentEvents].slice(0, 60);
  }
  engine.lastDiagnostics = diagnostics.slice(0, 20);
  engine.lastMessage = actions.length
    ? `Executed ${actions.length} trade(s). Adaptive: buy >= ${engine.config.buyTriggerPct}% / sell <= ${engine.config.sellTriggerPct}% / qty ${engine.config.tradeQty}.`
    : `No signal this cycle. Checked ${marketMap.size} symbol(s). Adaptive: buy >= ${engine.config.buyTriggerPct}% / sell <= ${engine.config.sellTriggerPct}% / qty ${engine.config.tradeQty}.`;
  return { ok: true as const, message: engine.lastMessage, actions };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Automation cycle failed unexpectedly.";
    engine.lastRunAt = new Date();
    engine.cycles += 1;
    engine.lastMessage = `Cycle failed safely: ${message}`;
    return { ok: false as const, message: engine.lastMessage, actions: [] as string[] };
  } finally {
    engine.runningCycle = false;
  }
}

export function startAutomation(userId: string, input?: Partial<AutomationConfig>) {
  if (engines.has(userId)) {
    const current = engines.get(userId)!;
    return {
      status: "already_running" as const,
      data: toStatus(current),
    };
  }
  const config = cleanConfig(input);
  const inst: EngineInstance = {
    timer: null,
    runningCycle: false,
    config,
    baseConfig: { ...config },
    startedAt: new Date(),
    lastRunAt: null,
    cycles: 0,
    ordersPlaced: 0,
    lastMessage: "Engine started.",
    prevPrices: new Map<string, number>(),
    recentEvents: [],
    lastDiagnostics: [],
    recentMoveAbs: [],
    recentCycleOrders: [],
  };
  inst.timer = setInterval(() => {
    void runAutomationCycle(userId);
  }, config.intervalSec * 1000);
  engines.set(userId, inst);
  return {
    status: "started" as const,
    data: toStatus(inst),
  };
}

async function settleOnStop(userId: string, inst: EngineInstance) {
  const holdings = await prisma.holding.findMany({ where: { userId } });
  const activeHoldings = holdings.filter((h) => h.quantity > 0);
  const symbols = activeHoldings.map((h) => h.symbol);
  const marketMap = await buildMarketMap(symbols);

  const failed: Array<{ symbol: string; quantity: number; reason: string }> = [];
  let soldPositions = 0;
  for (const h of activeHoldings) {
    if (!marketMap.has(h.symbol)) {
      failed.push({
        symbol: h.symbol,
        quantity: h.quantity,
        reason: "Live quote unavailable for square-off.",
      });
      continue;
    }
    try {
      await placeOrderDb({
        userId,
        symbol: h.symbol,
        side: "SELL",
        quantity: h.quantity,
        orderType: "MARKET",
        marketMap,
      });
      soldPositions += 1;
      const stopEvent: AutomationEvent = {
          id: `${Date.now()}-${h.symbol}-SELL-${Math.random().toString(36).slice(2, 7)}`,
          at: new Date().toISOString(),
          symbol: h.symbol,
          side: "SELL",
          quantity: h.quantity,
          price: marketMap.get(h.symbol)?.lastPrice ?? 0,
          movePct: 0,
          reason: "Auto square-off on engine stop",
        };
      inst.recentEvents = [
        stopEvent,
        ...inst.recentEvents,
      ].slice(0, 60);
    } catch (e) {
      failed.push({
        symbol: h.symbol,
        quantity: h.quantity,
        reason: e instanceof Error ? e.message : "Unknown square-off failure",
      });
    }
  }

  const postHoldings = await prisma.holding.findMany({ where: { userId }, select: { symbol: true } });
  const portfolioMap = await buildMarketMap(postHoldings.map((h) => h.symbol));
  const portfolio = await getPortfolioDb(userId, portfolioMap);

  return {
    soldPositions,
    failed,
    portfolio: {
      cash: portfolio.cash,
      invested: portfolio.invested,
      currentValue: portfolio.currentValue,
      netPnl: portfolio.netPnl ?? 0,
      realizedPnl: portfolio.realizedPnl ?? 0,
      unrealizedPnl: portfolio.unrealizedPnl ?? 0,
    },
  };
}

export async function stopAutomation(userId: string): Promise<AutomationStopResult> {
  const inst = engines.get(userId);
  if (!inst) return { status: "not_running" };
  if (inst.timer) clearInterval(inst.timer);
  const settlement = await settleOnStop(userId, inst);
  engines.delete(userId);
  return { status: "stopped", settlement };
}

function toStatus(inst: EngineInstance): AutomationStatus {
  return {
    running: true,
    config: inst.config,
    startedAt: inst.startedAt.toISOString(),
    lastRunAt: inst.lastRunAt ? inst.lastRunAt.toISOString() : null,
    cycles: inst.cycles,
    ordersPlaced: inst.ordersPlaced,
    lastMessage: inst.lastMessage,
    recentEvents: inst.recentEvents,
    lastDiagnostics: inst.lastDiagnostics,
  };
}

export async function getAutomationStatus(userId: string) {
  const inst = engines.get(userId);
  const base: AutomationStatus = inst
    ? toStatus(inst)
    : {
        running: false,
        config: null,
        startedAt: null,
        lastRunAt: null,
        cycles: 0,
        ordersPlaced: 0,
        lastMessage: "Engine is stopped.",
        recentEvents: [],
        lastDiagnostics: [],
      };
  return base;
}

export function getDefaultAutomationConfig() {
  return DEFAULT_CONFIG;
}

