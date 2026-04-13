import { prisma } from "@/lib/prisma";
import type { MarketStock } from "@/types/market";
import type { PortfolioSnapshot, TradeOrder, TradingStats } from "@/types/trading";

const MAX_ORDER_QUANTITY = 50_000;
const MAX_ORDER_NOTIONAL = 2_000_000; // per order
const MAX_CASH_DRAWDOWN = 300_000; // block new entries if cash drops too much

function toIso(d: Date) {
  return d.toISOString();
}

function computePortfolio(cash: number, holdings: Array<{ symbol: string; quantity: number; avgPrice: number }>, map: Map<string, MarketStock>): PortfolioSnapshot {
  const rows = holdings.map((h) => {
    const ltp = map.get(h.symbol)?.lastPrice ?? h.avgPrice;
    const invested = h.quantity * h.avgPrice;
    const currentValue = h.quantity * ltp;
    const pnl = currentValue - invested;
    const pnlPercent = invested > 0 ? (pnl / invested) * 100 : 0;
    return {
      symbol: h.symbol,
      quantity: h.quantity,
      avgPrice: h.avgPrice,
      ltp,
      invested,
      currentValue,
      pnl,
      pnlPercent,
    };
  });
  const invested = rows.reduce((sum, r) => sum + r.invested, 0);
  const currentValue = rows.reduce((sum, r) => sum + r.currentValue, 0);
  const totalPnl = currentValue - invested;
  const totalPnlPercent = invested > 0 ? (totalPnl / invested) * 100 : 0;
  return { cash, invested, currentValue, totalPnl, totalPnlPercent, holdings: rows };
}

function computeRealizedPnlFromTrades(trades: Array<{ symbol: string; side: string; quantity: number; price: number }>) {
  const inventory = new Map<string, { qty: number; avg: number }>();
  let realized = 0;

  for (const t of trades) {
    const symbol = t.symbol;
    const qty = Math.max(0, t.quantity);
    const price = t.price;
    const state = inventory.get(symbol) ?? { qty: 0, avg: 0 };

    if (t.side === "BUY") {
      const newQty = state.qty + qty;
      const newAvg = newQty > 0 ? (state.avg * state.qty + price * qty) / newQty : 0;
      inventory.set(symbol, { qty: newQty, avg: newAvg });
      continue;
    }

    const sellQty = Math.min(qty, state.qty);
    if (sellQty > 0) {
      realized += (price - state.avg) * sellQty;
      const remaining = state.qty - sellQty;
      inventory.set(symbol, { qty: remaining, avg: remaining > 0 ? state.avg : 0 });
    }
  }

  return realized;
}

export async function listOrdersDb(userId: string): Promise<TradeOrder[]> {
  const orders = await prisma.tradeOrder.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
  return orders.map((o) => ({
    id: o.id,
    symbol: o.symbol,
    side: o.side as TradeOrder["side"],
    quantity: o.quantity,
    orderType: o.orderType as TradeOrder["orderType"],
    limitPrice: o.limitPrice ?? undefined,
    executedPrice: o.executedPrice ?? undefined,
    status: o.status as TradeOrder["status"],
    createdAt: toIso(o.createdAt),
    updatedAt: toIso(o.updatedAt),
  }));
}

export async function listTradesDb(userId: string) {
  const trades = await prisma.executedTrade.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
  return trades.map((t) => ({
    id: t.id,
    orderId: t.orderId,
    symbol: t.symbol,
    side: t.side as "BUY" | "SELL",
    quantity: t.quantity,
    price: t.price,
    value: t.value,
    createdAt: toIso(t.createdAt),
  }));
}

export async function cancelOrderDb(userId: string, orderId: string) {
  const order = await prisma.tradeOrder.findFirst({ where: { id: orderId, userId } });
  if (!order) throw new Error("Order not found.");
  if (order.status !== "OPEN") throw new Error("Only open orders can be cancelled.");
  const updated = await prisma.tradeOrder.update({
    where: { id: orderId },
    data: { status: "CANCELLED" },
  });
  return updated;
}

export async function placeOrderDb(params: {
  userId: string;
  symbol: string;
  side: "BUY" | "SELL";
  quantity: number;
  orderType: "MARKET" | "LIMIT";
  limitPrice?: number;
  marketMap: Map<string, MarketStock>;
}) {
  const { userId, symbol, side, quantity, orderType, limitPrice, marketMap } = params;
  const clean = symbol.trim().toUpperCase();
  const quote = marketMap.get(clean);
  const quotePrice = (quote?.lastPrice ?? 0) > 0 ? (quote?.lastPrice ?? 0) : 0;
  const marketPrice = orderType === "MARKET" ? quotePrice : quotePrice || (limitPrice ?? 0);

  if (!Number.isFinite(quantity) || quantity < 1 || quantity !== Math.trunc(quantity)) {
    throw new Error("Quantity must be a positive whole number.");
  }
  if (quantity > MAX_ORDER_QUANTITY) {
    throw new Error(`Quantity cannot exceed ${MAX_ORDER_QUANTITY.toLocaleString("en-IN")}.`);
  }

  if (orderType === "MARKET" && marketPrice <= 0) {
    throw new Error(`Live quote unavailable for ${clean}. Try again shortly or place a LIMIT order.`);
  }

  const notionalCheckPrice = marketPrice > 0 ? marketPrice : limitPrice ?? 0;
  const notional = notionalCheckPrice * quantity;
  if (notional > MAX_ORDER_NOTIONAL) {
    throw new Error(`Order value exceeds risk limit of ₹${MAX_ORDER_NOTIONAL.toLocaleString("en-IN")}.`);
  }

  const shouldFill =
    orderType === "MARKET"
      ? marketPrice > 0
      : marketPrice > 0 && ((side === "BUY" && (limitPrice ?? 0) >= marketPrice) || (side === "SELL" && (limitPrice ?? 0) <= marketPrice));

  return prisma.$transaction(async (tx) => {
    const account = await tx.account.findUnique({ where: { userId } });
    if (!account) throw new Error("Account not found.");
    if (side === "BUY" && account.cash <= account.startingCash - MAX_CASH_DRAWDOWN) {
      throw new Error(
        `Risk block active: cash drawdown exceeded ₹${MAX_CASH_DRAWDOWN.toLocaleString("en-IN")}.`,
      );
    }

    const order = await tx.tradeOrder.create({
      data: {
        userId,
        symbol: clean,
        side,
        quantity,
        orderType,
        status: "OPEN",
        ...(orderType === "LIMIT" ? { limitPrice } : {}),
      },
    });

    if (!shouldFill) {
      return order;
    }

    const fillPrice = marketPrice;
    const value = fillPrice * quantity;

    if (side === "BUY") {
      if (account.cash < value) throw new Error("Insufficient cash to place buy order.");
      await tx.account.update({ where: { userId }, data: { cash: account.cash - value } });

      const existing = await tx.holding.findUnique({ where: { userId_symbol: { userId, symbol: clean } } });
      const prevQty = existing?.quantity ?? 0;
      const prevAvg = existing?.avgPrice ?? 0;
      const newQty = prevQty + quantity;
      const newAvg = newQty > 0 ? (prevAvg * prevQty + value) / newQty : 0;
      await tx.holding.upsert({
        where: { userId_symbol: { userId, symbol: clean } },
        create: { userId, symbol: clean, quantity: newQty, avgPrice: newAvg },
        update: { quantity: newQty, avgPrice: newAvg },
      });
    } else {
      const existing = await tx.holding.findUnique({ where: { userId_symbol: { userId, symbol: clean } } });
      const prevQty = existing?.quantity ?? 0;
      if (prevQty < quantity) throw new Error(`Not enough holdings to sell ${clean}.`);

      const remaining = prevQty - quantity;
      await tx.account.update({ where: { userId }, data: { cash: account.cash + value } });
      if (remaining === 0) {
        await tx.holding.delete({ where: { userId_symbol: { userId, symbol: clean } } });
      } else {
        await tx.holding.update({
          where: { userId_symbol: { userId, symbol: clean } },
          data: { quantity: remaining },
        });
      }
    }

    await tx.tradeOrder.update({
      where: { id: order.id },
      data: { status: "FILLED", executedPrice: fillPrice },
    });

    await tx.executedTrade.create({
      data: {
        userId,
        orderId: order.id,
        symbol: clean,
        side,
        quantity,
        price: fillPrice,
        value,
      },
    });

    return tx.tradeOrder.findUniqueOrThrow({ where: { id: order.id } });
  });
}

export async function getTradingStatsDb(userId: string): Promise<TradingStats> {
  const account = await prisma.account.findUnique({ where: { userId } });
  if (!account) throw new Error("Account not found.");

  const [open, filled, cancelled, total, tradesAgg, holdingsCount] = await Promise.all([
    prisma.tradeOrder.count({ where: { userId, status: "OPEN" } }),
    prisma.tradeOrder.count({ where: { userId, status: "FILLED" } }),
    prisma.tradeOrder.count({ where: { userId, status: "CANCELLED" } }),
    prisma.tradeOrder.count({ where: { userId } }),
    prisma.executedTrade.aggregate({ where: { userId }, _count: { id: true }, _sum: { value: true } }),
    prisma.holding.count({ where: { userId } }),
  ]);

  return {
    cash: account.cash,
    startingCash: account.startingCash,
    orders: { open, filled, cancelled, total },
    trades: {
      count: tradesAgg._count.id ?? 0,
      totalValue: tradesAgg._sum.value ?? 0,
    },
    holdingsCount,
  };
}

export async function getPortfolioDb(userId: string, map: Map<string, MarketStock>): Promise<PortfolioSnapshot> {
  const account = await prisma.account.findUnique({ where: { userId } });
  if (!account) throw new Error("Account not found.");
  const [holdings, trades] = await Promise.all([
    prisma.holding.findMany({ where: { userId } }),
    prisma.executedTrade.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
      select: { symbol: true, side: true, quantity: true, price: true },
    }),
  ]);
  const snapshot = computePortfolio(account.cash, holdings, map);
  const realizedPnl = computeRealizedPnlFromTrades(trades);
  const unrealizedPnl = snapshot.totalPnl;
  return {
    ...snapshot,
    realizedPnl,
    unrealizedPnl,
    netPnl: realizedPnl + unrealizedPnl,
  };
}

export async function listHoldingSymbolsDb(userId: string): Promise<string[]> {
  const holdings = await prisma.holding.findMany({ where: { userId }, select: { symbol: true } });
  return holdings.map((h) => h.symbol);
}

