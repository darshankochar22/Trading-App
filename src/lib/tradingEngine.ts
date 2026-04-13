import type { MarketStock } from "@/types/market";
import type {
  ExecutedTrade,
  Holding,
  OrderStatus,
  PlaceOrderRequest,
  PortfolioSnapshot,
  TradeOrder,
  TradingStats,
} from "@/types/trading";

type EngineState = {
  cash: number;
  orders: TradeOrder[];
  trades: ExecutedTrade[];
  holdings: Record<string, { quantity: number; avgPrice: number }>;
};

const GLOBAL_KEY = "__STELLA_TRADING_ENGINE__";

/** Starting virtual cash for the paper engine (exported for stats APIs). */
export const PAPER_STARTING_CASH = 1_000_000;

function getEngineState(): EngineState {
  const g = globalThis as typeof globalThis & { [GLOBAL_KEY]?: EngineState };
  if (!g[GLOBAL_KEY]) {
    g[GLOBAL_KEY] = {
      cash: PAPER_STARTING_CASH,
      orders: [],
      trades: [],
      holdings: {},
    };
  }
  return g[GLOBAL_KEY];
}

function nowIso() {
  return new Date().toISOString();
}

const MAX_ORDER_QUANTITY = 500_000;

function id(prefix: string) {
  const suffix =
    typeof globalThis.crypto !== "undefined" && "randomUUID" in globalThis.crypto
      ? globalThis.crypto.randomUUID()
      : Math.random().toString(36).slice(2, 14);
  return `${prefix}_${suffix}`;
}

function markStatus(order: TradeOrder, status: OrderStatus) {
  order.status = status;
  order.updatedAt = nowIso();
}

export function placeOrder(input: PlaceOrderRequest, marketMap: Map<string, MarketStock>): TradeOrder {
  const state = getEngineState();
  const cleanSymbol = input.symbol.trim().toUpperCase();
  const segment = input.segment ?? "EQUITY";
  const instrument = input.instrument ?? "CASH";
  const quote = marketMap.get(cleanSymbol);

  if (!cleanSymbol) {
    throw new Error("Symbol is required.");
  }
  const qty = Number(input.quantity);
  if (!Number.isFinite(qty) || qty !== Math.trunc(qty) || qty < 1) {
    throw new Error("Quantity must be a positive whole number.");
  }
  if (qty > MAX_ORDER_QUANTITY) {
    throw new Error(`Quantity cannot exceed ${MAX_ORDER_QUANTITY.toLocaleString("en-IN")}.`);
  }
  if (input.orderType === "LIMIT") {
    const lp = input.limitPrice;
    if (lp === undefined || !Number.isFinite(lp) || lp <= 0) {
      throw new Error("Limit price is required for limit orders.");
    }
  }

  const marketPrice = quote?.lastPrice ?? input.limitPrice ?? 0;
  if (marketPrice <= 0) {
    throw new Error("Unable to determine executable price.");
  }

  const order: TradeOrder = {
    id: id("ord"),
    symbol: cleanSymbol,
    segment,
    instrument,
    side: input.side,
    quantity: qty,
    orderType: input.orderType,
    limitPrice: input.limitPrice,
    status: "OPEN",
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  state.orders.unshift(order);

  // For MVP: execute immediately for market order or reachable limit.
  const shouldFill =
    input.orderType === "MARKET" ||
    (input.side === "BUY" && (input.limitPrice ?? 0) >= marketPrice) ||
    (input.side === "SELL" && (input.limitPrice ?? 0) <= marketPrice);

  if (!shouldFill) {
    return order;
  }

  const fillPrice = marketPrice;
  const value = fillPrice * qty;

  if (input.side === "BUY") {
    if (state.cash < value) {
      throw new Error("Insufficient cash to place buy order.");
    }
    state.cash -= value;
    const prev = state.holdings[cleanSymbol] ?? { quantity: 0, avgPrice: 0 };
    const newQty = prev.quantity + qty;
    const newAvg = newQty > 0 ? (prev.avgPrice * prev.quantity + value) / newQty : 0;
    state.holdings[cleanSymbol] = { quantity: newQty, avgPrice: newAvg };
  } else {
    const prev = state.holdings[cleanSymbol] ?? { quantity: 0, avgPrice: 0 };
    if (prev.quantity < qty) {
      throw new Error(`Not enough holdings to sell ${cleanSymbol}.`);
    }
    const remaining = prev.quantity - qty;
    state.cash += value;
    if (remaining === 0) {
      delete state.holdings[cleanSymbol];
    } else {
      state.holdings[cleanSymbol] = { quantity: remaining, avgPrice: prev.avgPrice };
    }
  }

  order.executedPrice = fillPrice;
  markStatus(order, "FILLED");

  const trade: ExecutedTrade = {
    id: id("trd"),
    orderId: order.id,
    symbol: cleanSymbol,
    segment,
    instrument,
    side: input.side,
    quantity: qty,
    price: fillPrice,
    value,
    createdAt: nowIso(),
  };
  state.trades.unshift(trade);

  return order;
}

export function cancelOrder(orderId: string): TradeOrder {
  const state = getEngineState();
  const order = state.orders.find((o) => o.id === orderId);
  if (!order) throw new Error("Order not found.");
  if (order.status !== "OPEN") throw new Error("Only open orders can be cancelled.");
  markStatus(order, "CANCELLED");
  return order;
}

export function listOrders(): TradeOrder[] {
  return getEngineState().orders;
}

export function listTrades(): ExecutedTrade[] {
  return getEngineState().trades;
}

/** Symbols with open positions — used to price the portfolio without loading the full market universe. */
export function listHoldingSymbols(): string[] {
  return Object.keys(getEngineState().holdings);
}

export function getTradingStats(): TradingStats {
  const state = getEngineState();
  let open = 0;
  let filled = 0;
  let cancelled = 0;
  for (const o of state.orders) {
    if (o.status === "OPEN") open += 1;
    else if (o.status === "FILLED") filled += 1;
    else if (o.status === "CANCELLED") cancelled += 1;
  }
  const totalValue = state.trades.reduce((sum, t) => sum + t.value, 0);
  return {
    cash: state.cash,
    startingCash: PAPER_STARTING_CASH,
    orders: {
      open,
      filled,
      cancelled,
      total: state.orders.length,
    },
    trades: {
      count: state.trades.length,
      totalValue,
    },
    holdingsCount: Object.keys(state.holdings).length,
  };
}

export function getPortfolio(marketMap: Map<string, MarketStock>): PortfolioSnapshot {
  const state = getEngineState();
  const holdings: Holding[] = Object.entries(state.holdings).map(([symbol, h]) => {
    const ltp = marketMap.get(symbol)?.lastPrice ?? h.avgPrice;
    const invested = h.quantity * h.avgPrice;
    const currentValue = h.quantity * ltp;
    const pnl = currentValue - invested;
    const pnlPercent = invested > 0 ? (pnl / invested) * 100 : 0;
    return {
      symbol,
      quantity: h.quantity,
      avgPrice: h.avgPrice,
      ltp,
      invested,
      currentValue,
      pnl,
      pnlPercent,
    };
  });

  const invested = holdings.reduce((sum, h) => sum + h.invested, 0);
  const currentValue = holdings.reduce((sum, h) => sum + h.currentValue, 0);
  const totalPnl = currentValue - invested;
  const totalPnlPercent = invested > 0 ? (totalPnl / invested) * 100 : 0;

  return {
    cash: state.cash,
    invested,
    currentValue,
    totalPnl,
    totalPnlPercent,
    holdings,
  };
}

