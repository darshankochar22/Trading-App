"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import DashboardHero from "@/components/dashboard/DashboardHero";
import AppContainer from "@/components/ui/AppContainer";
import MarketDepthWidget from "@/components/ui/MarketDepthWidget";
import type { MarketOverviewResponse } from "@/types/market";
import type { InstrumentType, OrderType, Side, TradeSegment } from "@/types/trading";
import type { MarketDepth } from "@/types/market";

type PlaceOrderResponse = {
  ok: boolean;
  message?: string;
};

const COMMODITY_SYMBOLS = ["GOLD", "SILVER", "CRUDEOIL", "NATURALGAS", "COPPER"];

export default function TradePage() {
  const [segment, setSegment] = useState<TradeSegment>("EQUITY");
  const [instrument, setInstrument] = useState<InstrumentType>("CASH");
  const [symbol, setSymbol] = useState("RELIANCE");
  const [side, setSide] = useState<Side>("BUY");
  const [quantity, setQuantity] = useState(1);
  const [orderType, setOrderType] = useState<OrderType>("MARKET");
  const [limitPrice, setLimitPrice] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [market, setMarket] = useState<MarketOverviewResponse | null>(null);
  const [depth, setDepth] = useState<MarketDepth | null>(null);
  const [depthLoading, setDepthLoading] = useState(false);
  const [feedback, setFeedback] = useState<string>("");
  const [upiOpen, setUpiOpen] = useState(false);
  const [upiPin, setUpiPin] = useState("");
  const [upiStep, setUpiStep] = useState<"pin" | "processing" | "success">("pin");
  const [upiTxnId, setUpiTxnId] = useState("");

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/market/overview", { cache: "no-store" });
      const json: MarketOverviewResponse = await res.json();
      if (json.ok) setMarket(json);
    }
    load();
  }, []);

  const selectedStock = useMemo(
    () => market?.stocks.find((s) => s.symbol === symbol.toUpperCase()),
    [market, symbol],
  );
  const selectedCommodity = useMemo(() => COMMODITY_SYMBOLS.find((s) => s === symbol.toUpperCase()), [symbol]);

  useEffect(() => {
    async function loadDepth() {
      if (segment !== "EQUITY") {
        setDepth(null);
        return;
      }
      if (!symbol.trim()) return;
      setDepthLoading(true);
      try {
        const res = await fetch(`/api/market/depth?symbol=${encodeURIComponent(symbol.toUpperCase())}`, {
          cache: "no-store",
        });
        const json = await res.json();
        if (json.ok) {
          setDepth(json.data);
        } else {
          setDepth(null);
        }
      } finally {
        setDepthLoading(false);
      }
    }
    loadDepth();
  }, [segment, symbol]);

  useEffect(() => {
    if (segment === "COMMODITY") {
      if (!COMMODITY_SYMBOLS.includes(symbol.toUpperCase())) {
        setSymbol(COMMODITY_SYMBOLS[0]);
      }
      if (instrument === "CASH") {
        setInstrument("FUTURES");
      }
    } else if (!selectedStock && market?.stocks.length) {
      setSymbol(market.stocks[0].symbol);
      setInstrument("CASH");
    }
  }, [segment, symbol, instrument, selectedStock, market]);

  async function place() {
    try {
      setLoading(true);
      setFeedback("");
      const res = await fetch("/api/trading/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symbol: symbol.toUpperCase(),
          segment,
          instrument,
          side,
          quantity,
          orderType,
          limitPrice: orderType === "LIMIT" ? limitPrice : undefined,
        }),
      });
      const json: PlaceOrderResponse = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.message ?? "Order failed");
      }
      setFeedback("Order placed successfully.");
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Unable to place order");
    } finally {
      setLoading(false);
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
  function openUpiForTrade() {
    setUpiPin("");
    setUpiTxnId(`TXN${Date.now().toString().slice(-8)}`);
    setUpiStep("pin");
    setUpiOpen(true);
  }
  async function confirmTradeUpi() {
    setUpiStep("processing");
    await new Promise((resolve) => setTimeout(resolve, 1000));
    await place();
    setUpiStep("success");
    setTimeout(() => setUpiOpen(false), 900);
  }

  return (
    <AppContainer as="main" className="max-w-7xl py-10">
      {upiOpen ? (
        <div className="fixed inset-0 z-70 flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-5 shadow-xl">
            {upiStep === "pin" ? (
              <>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">UPI Confirmation</p>
                <h3 className="mt-2 text-lg font-semibold text-gray-900">Authorize order</h3>
                <p className="mt-1 text-sm text-gray-600">
                  {side} {symbol.toUpperCase()} · Qty {quantity}
                </p>
                <div className="mt-4 flex items-center justify-center gap-2">
                  {Array.from({ length: 6 }).map((_, idx) => (
                    <div
                      key={`pin-box-${idx}`}
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
                      key={`key-${digit}`}
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
                    Confirm Order
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
                <p className="mt-3 text-sm font-semibold text-gray-900">Order confirmed</p>
                <p className="mt-1 text-xs text-gray-500">UPI Ref: {upiTxnId}</p>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      <DashboardHero
        eyebrow="Execution Workspace"
        title="Trade Terminal"
        description="Step-by-step flow for Equity and Commodity trading across Cash, Futures, and Options."
      />

      <section className="mt-6 grid gap-6 lg:grid-cols-[380px_1fr]">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-900">Order Ticket (Step-by-Step)</h2>
          <div className="mt-4 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Step 1: Select Market</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setSegment("EQUITY")}
                className={`rounded-lg px-3 py-2 text-sm ${segment === "EQUITY" ? "bg-black text-white" : "border border-gray-300 text-gray-700"}`}
              >
                Equity
              </button>
              <button
                onClick={() => setSegment("COMMODITY")}
                className={`rounded-lg px-3 py-2 text-sm ${segment === "COMMODITY" ? "bg-black text-white" : "border border-gray-300 text-gray-700"}`}
              >
                Commodity
              </button>
            </div>

            <p className="pt-1 text-xs font-semibold uppercase tracking-wide text-gray-500">Step 2: Select Instrument</p>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setInstrument("CASH")}
                disabled={segment === "COMMODITY"}
                className={`rounded-lg px-3 py-2 text-xs ${instrument === "CASH" ? "bg-black text-white" : "border border-gray-300 text-gray-700"} disabled:opacity-50`}
              >
                Cash
              </button>
              <button
                onClick={() => setInstrument("FUTURES")}
                className={`rounded-lg px-3 py-2 text-xs ${instrument === "FUTURES" ? "bg-black text-white" : "border border-gray-300 text-gray-700"}`}
              >
                Futures
              </button>
              <button
                onClick={() => setInstrument("OPTIONS")}
                className={`rounded-lg px-3 py-2 text-xs ${instrument === "OPTIONS" ? "bg-black text-white" : "border border-gray-300 text-gray-700"}`}
              >
                Options
              </button>
            </div>

            <p className="pt-1 text-xs font-semibold uppercase tracking-wide text-gray-500">Step 3: Select Symbol</p>
            {segment === "COMMODITY" ? (
              <select
                value={symbol}
                onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              >
                {COMMODITY_SYMBOLS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            ) : (
            <input
              value={symbol}
              onChange={(e) => setSymbol(e.target.value.toUpperCase())}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              placeholder="Symbol (e.g. RELIANCE)"
            />
            )}

            <p className="pt-1 text-xs font-semibold uppercase tracking-wide text-gray-500">Step 4: Side & Order Type</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setSide("BUY")}
                className={`rounded-lg px-3 py-2 text-sm font-medium ${side === "BUY" ? "bg-green-600 text-white" : "border border-gray-300 text-gray-700"}`}
              >
                Buy
              </button>
              <button
                onClick={() => setSide("SELL")}
                className={`rounded-lg px-3 py-2 text-sm font-medium ${side === "SELL" ? "bg-red-600 text-white" : "border border-gray-300 text-gray-700"}`}
              >
                Sell
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setOrderType("MARKET")}
                className={`rounded-lg px-3 py-2 text-sm ${orderType === "MARKET" ? "bg-black text-white" : "border border-gray-300 text-gray-700"}`}
              >
                Market
              </button>
              <button
                onClick={() => setOrderType("LIMIT")}
                className={`rounded-lg px-3 py-2 text-sm ${orderType === "LIMIT" ? "bg-black text-white" : "border border-gray-300 text-gray-700"}`}
              >
                Limit
              </button>
            </div>

            <p className="pt-1 text-xs font-semibold uppercase tracking-wide text-gray-500">Step 5: Quantity & Confirm</p>
            <input
              type="number"
              min={1}
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              placeholder="Quantity"
            />

            {orderType === "LIMIT" ? (
              <input
                type="number"
                min={0}
                value={limitPrice}
                onChange={(e) => setLimitPrice(Number(e.target.value))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                placeholder="Limit price"
              />
            ) : null}

            <button
              disabled={loading}
              onClick={openUpiForTrade}
              className="w-full rounded-lg bg-black px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {loading ? "Placing..." : "Place Order"}
            </button>
            {feedback ? <p className="text-xs text-gray-700">{feedback}</p> : null}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-900">Selected Symbol Snapshot</h2>
            {segment === "EQUITY" && selectedStock ? (
              <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                <p>Symbol: <span className="font-semibold">{selectedStock.symbol}</span></p>
                <p>CMP: <span className="font-semibold">{selectedStock.lastPrice.toFixed(2)}</span></p>
                <p>Change: <span className={selectedStock.change >= 0 ? "text-green-600" : "text-red-600"}>{selectedStock.change.toFixed(2)}</span></p>
                <p>%Chg: <span className={selectedStock.pChange >= 0 ? "text-green-600" : "text-red-600"}>{selectedStock.pChange.toFixed(2)}%</span></p>
                <p>
                  Chart:{" "}
                  <Link href={`/dashboard/stocks/${selectedStock.symbol}`} className="font-semibold text-blue-600 hover:underline">
                    Open full chart
                  </Link>
                </p>
              </div>
            ) : segment === "COMMODITY" && selectedCommodity ? (
              <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                <p>Symbol: <span className="font-semibold">{selectedCommodity}</span></p>
                <p>Segment: <span className="font-semibold">COMMODITY</span></p>
                <p>Instrument: <span className="font-semibold">{instrument}</span></p>
                <p className="text-amber-700">Execution uses internal commodity reference pricing.</p>
              </div>
            ) : (
              <p className="mt-3 text-sm text-gray-500">Symbol not found in current NIFTY list.</p>
            )}
          </div>

          {segment === "EQUITY" ? <MarketDepthWidget depth={depth} loading={depthLoading} /> : null}

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-900">
              {segment === "EQUITY" ? "Live Listed Companies" : "Commodity Universe"}
            </h2>
            <div className="mt-3 max-h-[420px] overflow-auto">
              {segment === "EQUITY" ? (
                <table className="w-full text-left text-sm">
                  <thead className="text-xs uppercase text-gray-500">
                    <tr>
                      <th className="py-2">Symbol</th>
                      <th className="py-2">CMP</th>
                      <th className="py-2">%Chg</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(market?.stocks ?? []).map((s) => (
                      <tr key={s.symbol} className="cursor-pointer border-t border-gray-100 hover:bg-gray-50" onClick={() => setSymbol(s.symbol)}>
                        <td className="py-2 font-medium">
                          <Link href={`/dashboard/stocks/${s.symbol}`} className="hover:underline">
                            {s.symbol}
                          </Link>
                        </td>
                        <td className="py-2">{s.lastPrice.toFixed(2)}</td>
                        <td className={`py-2 ${s.pChange >= 0 ? "text-green-600" : "text-red-600"}`}>
                          {s.pChange.toFixed(2)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <ul className="space-y-2 text-sm">
                  {COMMODITY_SYMBOLS.map((s) => (
                    <li key={s} className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2">
                      <span className="font-medium">{s}</span>
                      <button
                        onClick={() => setSymbol(s)}
                        className="rounded-md border border-gray-300 px-2 py-1 text-xs hover:bg-gray-50"
                      >
                        Select
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </section>
    </AppContainer>
  );
}
