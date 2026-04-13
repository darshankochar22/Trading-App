"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type TradingOrder = { id: string; status: "OPEN" | "FILLED" | "CANCELLED" };
type TradingTrade = { id: string };
type PortfolioResponse = {
  ok: boolean;
  data?: {
    cash: number;
    currentValue: number;
    totalPnl: number;
    totalPnlPercent: number;
    holdings: Array<{ symbol: string }>;
  };
};

export default function HomeActionHub() {
  const [symbol, setSymbol] = useState("RELIANCE");
  const [placing, setPlacing] = useState(false);
  const [tradeMessage, setTradeMessage] = useState("");
  const [orders, setOrders] = useState<TradingOrder[]>([]);
  const [trades, setTrades] = useState<TradingTrade[]>([]);
  const [portfolio, setPortfolio] = useState<PortfolioResponse["data"] | null>(
    null,
  );
  const [ipos, setIpos] = useState<
    Array<{ name: string; issueStartDate: string; issueEndDate: string }>
  >([]);
  const [upiOpen, setUpiOpen] = useState(false);
  const [upiPin, setUpiPin] = useState("");
  const [upiStep, setUpiStep] = useState<"pin" | "processing" | "success">("pin");
  const [upiTxnId, setUpiTxnId] = useState("");
  const [pendingSide, setPendingSide] = useState<"BUY" | "SELL" | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [portfolioRes, ordersRes, tradesRes, ipoRes] = await Promise.all([
          fetch("/api/trading/portfolio", { cache: "no-store" }),
          fetch("/api/trading/orders", { cache: "no-store" }),
          fetch("/api/trading/trades", { cache: "no-store" }),
          fetch("/api/market/ipos", { cache: "no-store" }),
        ]);
        const portfolioJson: PortfolioResponse = await portfolioRes.json();
        const ordersJson = await ordersRes.json();
        const tradesJson = await tradesRes.json();
        const ipoJson = await ipoRes.json();
        if (portfolioJson.ok) setPortfolio(portfolioJson.data ?? null);
        setOrders(ordersJson.data ?? []);
        setTrades(tradesJson.data ?? []);
        setIpos((ipoJson.data ?? []).slice(0, 3));
      } catch {
        // Keep home interactive even when one feed fails.
      }
    }
    load();
  }, []);

  const openOrders = useMemo(
    () => orders.filter((o) => o.status === "OPEN").length,
    [orders],
  );

  async function runQuickTrade(side: "BUY" | "SELL") {
    try {
      setPlacing(true);
      setTradeMessage("");
      const res = await fetch("/api/trading/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symbol: symbol.toUpperCase(),
          segment: "EQUITY",
          instrument: "CASH",
          side,
          quantity: 1,
          orderType: "MARKET",
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.message ?? "Order failed");
      }
      setTradeMessage(
        `${side} order placed for ${symbol.toUpperCase()} (Qty 1).`,
      );
      const ordersRes = await fetch("/api/trading/orders", {
        cache: "no-store",
      });
      const tradesRes = await fetch("/api/trading/trades", {
        cache: "no-store",
      });
      const ordersJson = await ordersRes.json();
      const tradesJson = await tradesRes.json();
      setOrders(ordersJson.data ?? []);
      setTrades(tradesJson.data ?? []);
    } catch (error) {
      setTradeMessage(
        error instanceof Error ? error.message : "Unable to place quick order",
      );
    } finally {
      setPlacing(false);
    }
  }

  function pressPinDigit(digit: string) {
    setUpiPin((prev) => (prev.length >= 6 ? prev : `${prev}${digit}`));
  }
  function backspacePin() {
    setUpiPin((prev) => prev.slice(0, -1));
  }
  function clearPin() {
    setUpiPin("");
  }

  function openTradeUpi(side: "BUY" | "SELL") {
    setPendingSide(side);
    setUpiPin("");
    setUpiTxnId(`TXN${Date.now().toString().slice(-8)}`);
    setUpiStep("pin");
    setUpiOpen(true);
  }

  async function confirmTradeUpi() {
    if (!pendingSide) return;
    setUpiStep("processing");
    await new Promise((resolve) => setTimeout(resolve, 1000));
    await runQuickTrade(pendingSide);
    setUpiStep("success");
    setTimeout(() => setUpiOpen(false), 900);
  }

  return (
    <section className="mt-10 grid gap-4 lg:grid-cols-2">
      {upiOpen ? (
        <div className="fixed inset-0 z-70 flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-5 shadow-xl">
            {upiStep === "pin" ? (
              <>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">UPI Confirmation</p>
                <h3 className="mt-2 text-lg font-semibold text-gray-900">Authorize trade</h3>
                <p className="mt-1 text-sm text-gray-600">
                  {pendingSide} {symbol.toUpperCase()} · Qty 1
                </p>
                <div className="mt-4 flex items-center justify-center gap-2">
                  {Array.from({ length: 6 }).map((_, idx) => (
                    <div
                      key={`qt-pin-box-${idx}`}
                      className={`flex h-10 w-9 items-center justify-center rounded-md border text-sm font-semibold ${
                        idx < upiPin.length ? "border-blue-400 bg-blue-50 text-blue-700" : "border-gray-300 bg-gray-50 text-gray-300"
                      }`}
                    >
                      {idx < upiPin.length ? "•" : ""}
                    </div>
                  ))}
                </div>
                <div className="mx-auto mt-4 grid w-full max-w-[260px] grid-cols-3 gap-2">
                  {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((digit) => (
                    <button
                      key={`qt-key-${digit}`}
                      type="button"
                      onClick={() => pressPinDigit(digit)}
                      className="rounded-lg border border-gray-200 bg-white py-2 text-sm font-medium text-gray-900 hover:bg-gray-50"
                    >
                      {digit}
                    </button>
                  ))}
                  <button type="button" onClick={clearPin} className="rounded-lg border border-gray-200 bg-white py-2 text-xs font-medium text-gray-700 hover:bg-gray-50">
                    Clear
                  </button>
                  <button type="button" onClick={() => pressPinDigit("0")} className="rounded-lg border border-gray-200 bg-white py-2 text-sm font-medium text-gray-900 hover:bg-gray-50">
                    0
                  </button>
                  <button type="button" onClick={backspacePin} className="rounded-lg border border-gray-200 bg-white py-2 text-xs font-medium text-gray-700 hover:bg-gray-50">
                    ⌫
                  </button>
                </div>
                <div className="mt-4 flex justify-end gap-2">
                  <button type="button" onClick={() => setUpiOpen(false)} className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700">
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => void confirmTradeUpi()}
                    disabled={upiPin.length < 4}
                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Confirm Trade
                  </button>
                </div>
              </>
            ) : null}
            {upiStep === "processing" ? (
              <div className="py-6 text-center">
                <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600" />
                <p className="mt-3 text-sm font-medium text-gray-900">Processing transaction...</p>
              </div>
            ) : null}
            {upiStep === "success" ? (
              <div className="py-5 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-white shadow-md shadow-blue-200">✓</div>
                <p className="mt-3 text-sm font-semibold text-gray-900">Trade confirmed</p>
                <p className="mt-1 text-xs text-gray-500">UPI Ref: {upiTxnId}</p>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      <article className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">Quick Trade</h3>
          <Link
            href="/dashboard/trade"
            className="text-xs font-medium text-blue-600 hover:underline"
          >
            Open full terminal
          </Link>
        </div>
        <p className="mt-1 text-xs text-gray-500">
          Main feature: place market order in one click.
        </p>
        <div className="mt-3 flex gap-2">
          <input
            value={symbol}
            onChange={(e) => setSymbol(e.target.value.toUpperCase())}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            placeholder="Symbol"
          />
          <button
            onClick={() => openTradeUpi("BUY")}
            disabled={placing}
            className="rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            Buy 1
          </button>
          <button
            onClick={() => openTradeUpi("SELL")}
            disabled={placing}
            className="rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            Sell 1
          </button>
        </div>
        {tradeMessage ? (
          <p className="mt-2 text-xs text-gray-700">{tradeMessage}</p>
        ) : null}
      </article>

      <article className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">
            Portfolio Snapshot
          </h3>
          <Link
            href="/dashboard/portfolio"
            className="text-xs font-medium text-blue-600 hover:underline"
          >
            Open portfolio
          </Link>
        </div>
        <p className="mt-1 text-xs text-gray-500">
          Main feature: monitor P&L instantly.
        </p>
        <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
          <p className="rounded-lg bg-gray-50 p-2">
            Cash:{" "}
            <span className="font-semibold">
              {(portfolio?.cash ?? 0).toFixed(2)}
            </span>
          </p>
          <p className="rounded-lg bg-gray-50 p-2">
            P&L:{" "}
            <span
              className={`font-semibold ${(portfolio?.totalPnl ?? 0) >= 0 ? "text-green-600" : "text-red-600"}`}
            >
              {(portfolio?.totalPnl ?? 0).toFixed(2)}
            </span>
          </p>
          <p className="rounded-lg bg-gray-50 p-2">
            Value:{" "}
            <span className="font-semibold">
              {(portfolio?.currentValue ?? 0).toFixed(2)}
            </span>
          </p>
          <p className="rounded-lg bg-gray-50 p-2">
            Holdings:{" "}
            <span className="font-semibold">
              {portfolio?.holdings?.length ?? 0}
            </span>
          </p>
        </div>
      </article>

      <article className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">
            Orders & Trades Pulse
          </h3>
          <Link
            href="/dashboard/orders"
            className="text-xs font-medium text-blue-600 hover:underline"
          >
            Open order book
          </Link>
        </div>
        <p className="mt-1 text-xs text-gray-500">
          Main feature: track lifecycle and executions.
        </p>
        <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
          <p className="rounded-lg bg-gray-50 p-2 text-center">
            Total Orders
            <br />
            <span className="font-semibold">{orders.length}</span>
          </p>
          <p className="rounded-lg bg-gray-50 p-2 text-center">
            Open
            <br />
            <span className="font-semibold">{openOrders}</span>
          </p>
          <p className="rounded-lg bg-gray-50 p-2 text-center">
            Trades
            <br />
            <span className="font-semibold">{trades.length}</span>
          </p>
        </div>
      </article>

      <article className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900">IPO Pulse</h2>
          <Link
            href="/dashboard/mutual-funds"
            className="text-xs font-medium text-blue-600 hover:underline"
          >
            Explore funds & SIP
          </Link>
        </div>
        <p className="mt-1 text-xs text-gray-500">
          Main feature: upcoming issue windows at a glance.
        </p>
        <ul className="mt-3 space-y-2 text-sm">
          {ipos.map((ipo) => (
            <li
              key={`${ipo.name}-${ipo.issueStartDate}`}
              className="rounded-lg border border-gray-100 p-2.5"
            >
              <p className="font-medium text-gray-900">{ipo.name || "IPO"}</p>
              <p className="text-xs text-gray-600">
                {ipo.issueStartDate} to {ipo.issueEndDate}
              </p>
            </li>
          ))}
          {!ipos.length ? (
            <li className="text-xs text-gray-500">
              No IPO data available right now.
            </li>
          ) : null}
        </ul>
      </article>
    </section>
  );
}
