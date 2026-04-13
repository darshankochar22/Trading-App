"use client";

import { useEffect, useMemo, useState } from "react";

type StrategyStatus = {
  running: boolean;
  config: {
    symbols: string[];
    intervalSec: number;
    buyTriggerPct: number;
    sellTriggerPct: number;
    maxPositionPerSymbol: number;
    maxDailyLoss: number;
    tradeQty: number;
    adaptiveMode?: boolean;
    targetTradesPerCycle?: number;
    volatilityLookback?: number;
  } | null;
  startedAt: string | null;
  lastRunAt: string | null;
  cycles: number;
  ordersPlaced: number;
  lastMessage: string;
  recentEvents: Array<{
    id: string;
    at: string;
    symbol: string;
    side: "BUY" | "SELL";
    quantity: number;
    price: number;
    movePct: number;
    reason: string;
  }>;
  lastDiagnostics?: Array<{
    symbol: string;
    lastPrice: number;
    movePct: number;
    source: "tick" | "day";
    action: "BUY" | "SELL" | "SKIP";
    reason: string;
  }>;
};

type Performance = {
  asOf: string;
  cash: number;
  startingCash: number;
  netPnl: number;
  realizedPnl: number;
  unrealizedPnl: number;
  totalOrders: number;
  totalTrades: number;
  latestTrades: Array<{
    id: string;
    symbol: string;
    side: "BUY" | "SELL";
    quantity: number;
    price: number;
    createdAt: string;
  }>;
};

type CompanyOption = {
  symbol: string;
  companyName: string;
};

export default function AutomationPanel() {
  const [status, setStatus] = useState<StrategyStatus | null>(null);
  const [performance, setPerformance] = useState<Performance | null>(null);
  const [symbols, setSymbols] = useState("RELIANCE,TCS,HDFCBANK,INFY,ICICIBANK");
  const [selectedSymbols, setSelectedSymbols] = useState<string[]>(["RELIANCE", "TCS", "HDFCBANK", "INFY", "ICICIBANK"]);
  const [companyOptions, setCompanyOptions] = useState<CompanyOption[]>([]);
  const [companyQuery, setCompanyQuery] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [intervalSec, setIntervalSec] = useState("300");
  const [buyTriggerPct, setBuyTriggerPct] = useState("0.25");
  const [sellTriggerPct, setSellTriggerPct] = useState("-0.25");
  const [maxPositionPerSymbol, setMaxPositionPerSymbol] = useState("20");
  const [maxDailyLoss, setMaxDailyLoss] = useState("5000");
  const [tradeQty, setTradeQty] = useState("1");
  const [loading, setLoading] = useState(true);
  const [busyAction, setBusyAction] = useState<"start" | "stop" | "tick" | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activityToasts, setActivityToasts] = useState<
    Array<{
      id: string;
      symbol: string;
      side: "BUY" | "SELL";
      quantity: number;
      price: number;
      at: string;
    }>
  >([]);
  const [seenEventIds, setSeenEventIds] = useState<string[]>([]);

  async function loadAll() {
    try {
      const [statusRes, perfRes, overviewRes] = await Promise.all([
        fetch("/api/automation/strategy", { cache: "no-store" }),
        fetch("/api/automation/performance", { cache: "no-store" }),
        fetch("/api/market/overview", { cache: "no-store" }),
      ]);
      const statusJson = await statusRes.json();
      const perfJson = await perfRes.json();
      const overviewJson = await overviewRes.json();

      if (!statusRes.ok || !statusJson?.ok) {
        throw new Error(statusJson?.message ?? "Unable to load automation status");
      }
      if (!perfRes.ok || !perfJson?.ok) {
        throw new Error(perfJson?.message ?? "Unable to load automation performance");
      }
      if (overviewRes.ok && overviewJson?.ok) {
        const options: CompanyOption[] = (overviewJson.stocks ?? [])
          .map((s: { symbol?: string; companyName?: string }) => ({
            symbol: String(s.symbol ?? ""),
            companyName: String(s.companyName ?? s.symbol ?? ""),
          }))
          .filter((s: CompanyOption) => s.symbol)
          .slice(0, 220);
        setCompanyOptions(options);
      }
      setStatus(statusJson.data);
      setPerformance(perfJson.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load automation data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let active = true;
    async function boot() {
      if (!active) return;
      await loadAll();
    }
    void boot();
    const id = setInterval(() => {
      if (!active) return;
      void loadAll();
    }, 10000);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, []);

  useEffect(() => {
    if (!status?.config) return;
    setSymbols(status.config.symbols.join(","));
    setSelectedSymbols(status.config.symbols);
    setIntervalSec("300");
    setBuyTriggerPct(String(status.config.buyTriggerPct));
    setSellTriggerPct(String(status.config.sellTriggerPct));
    setMaxPositionPerSymbol(String(status.config.maxPositionPerSymbol));
    setMaxDailyLoss(String(status.config.maxDailyLoss));
    setTradeQty(String(status.config.tradeQty));
  }, [status?.config]);

  useEffect(() => {
    const parsed = symbols
      .split(",")
      .map((s) => s.trim().toUpperCase())
      .filter(Boolean);
    setSelectedSymbols(parsed);
  }, [symbols]);

  useEffect(() => {
    const events = status?.recentEvents ?? [];
    if (!events.length) return;
    const seen = new Set(seenEventIds);
    const unseen = events.filter((e) => !seen.has(e.id)).slice(0, 3);
    if (!unseen.length) return;

    setSeenEventIds((prev) => [...unseen.map((e) => e.id), ...prev].slice(0, 300));
    setActivityToasts((prev) => {
      const next = [
        ...unseen.map((e) => ({
          id: e.id,
          symbol: e.symbol,
          side: e.side,
          quantity: e.quantity,
          price: e.price,
          at: e.at,
        })),
        ...prev,
      ].slice(0, 5);
      return next;
    });

    unseen.forEach((e) => {
      window.setTimeout(() => {
        setActivityToasts((prev) => prev.filter((t) => t.id !== e.id));
      }, 5500);
    });
  }, [status?.recentEvents, seenEventIds]);

  const pnlTone = useMemo(() => {
    const value = performance?.netPnl ?? 0;
    if (value > 0) return "text-emerald-700";
    if (value < 0) return "text-rose-700";
    return "text-gray-900";
  }, [performance?.netPnl]);

  const diagnostics = useMemo(() => status?.lastDiagnostics ?? [], [status?.lastDiagnostics]);
  const skipReasonSummary = useMemo(() => {
    const map = new Map<string, number>();
    for (const item of diagnostics) {
      if (item.action !== "SKIP") continue;
      map.set(item.reason, (map.get(item.reason) ?? 0) + 1);
    }
    return [...map.entries()]
      .map(([reason, count]) => ({ reason, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [diagnostics]);

  const filteredCompanies = useMemo(() => {
    const q = companyQuery.trim().toLowerCase();
    if (!q) return companyOptions;
    return companyOptions.filter((c) => c.symbol.toLowerCase().includes(q) || c.companyName.toLowerCase().includes(q));
  }, [companyOptions, companyQuery]);

  function toggleCompany(symbol: string) {
    setSelectedSymbols((prev) => {
      const has = prev.includes(symbol);
      const next = has ? prev.filter((s) => s !== symbol) : [...prev, symbol];
      setSymbols(next.join(","));
      return next;
    });
  }

  async function startEngine() {
    setError(null);
    setMessage(null);
    setBusyAction("start");
    try {
      const payload = {
        symbols: symbols
          .split(",")
          .map((s) => s.trim().toUpperCase())
          .filter(Boolean),
        intervalSec: Number(intervalSec),
        buyTriggerPct: Number(buyTriggerPct),
        sellTriggerPct: Number(sellTriggerPct),
        maxPositionPerSymbol: Number(maxPositionPerSymbol),
        maxDailyLoss: Number(maxDailyLoss),
        tradeQty: Number(tradeQty),
      };
      const res = await fetch("/api/automation/strategy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok || !json?.ok) throw new Error(json?.message ?? "Unable to start strategy");
      setMessage(json.status === "already_running" ? "Engine already running." : "Automation started.");
      await loadAll();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to start strategy");
    } finally {
      setBusyAction(null);
    }
  }

  async function stopEngine() {
    setError(null);
    setMessage(null);
    setBusyAction("stop");
    try {
      const res = await fetch("/api/automation/strategy", { method: "DELETE" });
      const json = await res.json();
      if (!res.ok || !json?.ok) throw new Error(json?.message ?? "Unable to stop strategy");
      if (json.status === "not_running") {
        setMessage("Engine already stopped.");
      } else if (json?.settlement) {
        const failed = Number(json.settlement.failed?.length ?? 0);
        setMessage(
          `Automation stopped. Square-off done for ${json.settlement.soldPositions} position(s). ` +
            `Net P&L: ₹${Number(json.settlement.portfolio?.netPnl ?? 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}` +
            (failed ? `, ${failed} failed.` : "."),
        );
      } else {
        setMessage("Automation stopped.");
      }
      await loadAll();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to stop strategy");
    } finally {
      setBusyAction(null);
    }
  }

  async function runTick() {
    setError(null);
    setMessage(null);
    setBusyAction("tick");
    try {
      const res = await fetch("/api/automation/strategy/tick", { method: "POST" });
      const json = await res.json();
      if (!res.ok || !json?.ok) throw new Error(json?.message ?? "Unable to run cycle");
      setMessage(json.message ?? "Cycle completed.");
      await loadAll();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to run cycle");
    } finally {
      setBusyAction(null);
    }
  }

  return (
    <section className="mt-8 overflow-hidden rounded-3xl border border-gray-200 bg-linear-to-b from-slate-50 via-white to-white p-5 shadow-sm">
      {activityToasts.length ? (
        <div className="pointer-events-none fixed right-4 top-24 z-80 flex w-[320px] flex-col gap-2">
          {activityToasts.map((t) => (
            <div
              key={t.id}
              className={`rounded-xl border bg-white/95 p-3 shadow-lg backdrop-blur-sm transition-all duration-300 ${
                t.side === "BUY" ? "border-emerald-200" : "border-rose-200"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-xs font-semibold text-gray-900">
                  Engine {t.side === "BUY" ? "bought" : "sold"} {t.symbol}
                </p>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                    t.side === "BUY" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                  }`}
                >
                  {t.side}
                </span>
              </div>
              <p className="mt-1 text-xs text-gray-600">
                Qty {t.quantity} @ ₹{t.price.toFixed(2)}
              </p>
              <p className="mt-1 text-[10px] text-gray-500">{new Date(t.at).toLocaleTimeString()}</p>
            </div>
          ))}
        </div>
      ) : null}

      {pickerOpen ? (
        <div className="fixed inset-0 z-70 flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm">
          <div className="app-card-elevated w-full max-w-2xl rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-gray-900">Select Companies</h3>
              <button
                type="button"
                onClick={() => setPickerOpen(false)}
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
              >
                Done
              </button>
            </div>
            <input
              value={companyQuery}
              onChange={(e) => setCompanyQuery(e.target.value)}
              placeholder="Search by symbol or company name..."
              className="mt-3 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
            <div className="mt-3 max-h-[360px] overflow-y-auto rounded-lg border border-gray-100">
              {filteredCompanies.map((c) => {
                const checked = selectedSymbols.includes(c.symbol);
                return (
                  <label
                    key={c.symbol}
                    className="flex cursor-pointer items-center justify-between border-b border-gray-100 px-3 py-2 last:border-b-0 hover:bg-gray-50"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900">{c.symbol}</p>
                      <p className="text-xs text-gray-500">{c.companyName}</p>
                    </div>
                    <input type="checkbox" checked={checked} onChange={() => toggleCompany(c.symbol)} className="h-4 w-4" />
                  </label>
                );
              })}
              {!filteredCompanies.length ? <p className="px-3 py-6 text-center text-xs text-gray-500">No companies found.</p> : null}
            </div>
          </div>
        </div>
      ) : null}

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Automation Engine</h2>
          <p className="mt-1 text-xs text-gray-600">Continuous strategy execution with selected companies, live timeline, and risk guardrails.</p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              status?.running ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-700"
            }`}
          >
            {status?.running ? "Running" : "Stopped"}
          </span>
          <button
            type="button"
            onClick={() => void runTick()}
            disabled={busyAction !== null || !status?.running}
            className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busyAction === "tick" ? "Running..." : "Run One Cycle"}
          </button>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-3">
          <p className="text-xs text-gray-500">Net P&L</p>
          <p className={`mt-1 text-lg font-semibold ${pnlTone}`}>
            {performance ? `₹${performance.netPnl.toLocaleString("en-IN", { maximumFractionDigits: 0 })}` : "--"}
          </p>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-3">
          <p className="text-xs text-gray-500">Cash</p>
          <p className="mt-1 text-lg font-semibold text-gray-900">
            {performance ? `₹${performance.cash.toLocaleString("en-IN", { maximumFractionDigits: 0 })}` : "--"}
          </p>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-3">
          <p className="text-xs text-gray-500">Money Made/Lost</p>
          <p className={`mt-1 text-lg font-semibold ${pnlTone}`}>
            {performance
              ? `₹${(performance.cash - performance.startingCash).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`
              : "--"}
          </p>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-3">
          <p className="text-xs text-gray-500">Cycles</p>
          <p className="mt-1 text-lg font-semibold text-gray-900">{status ? status.cycles.toLocaleString("en-IN") : "--"}</p>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-3 sm:col-span-2 lg:col-span-1">
          <p className="text-xs text-gray-500">Orders by Engine</p>
          <p className="mt-1 text-lg font-semibold text-gray-900">{status ? status.ordersPlaced.toLocaleString("en-IN") : "--"}</p>
        </div>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-gray-900">Decision Explainability</h3>
            <p className="text-xs text-gray-500">
              Move % vs trigger comparison for each checked symbol
            </p>
          </div>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-xs">
              <thead className="text-gray-500">
                <tr>
                  <th className="pb-2">Symbol</th>
                  <th className="pb-2 text-right">Last Price</th>
                  <th className="pb-2 text-right">Move %</th>
                  <th className="pb-2 text-right">Buy Trigger</th>
                  <th className="pb-2 text-right">Sell Trigger</th>
                  <th className="pb-2">Decision</th>
                  <th className="pb-2">Signal Source</th>
                  <th className="pb-2">Reason</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-3 text-gray-500">
                      Loading diagnostics...
                    </td>
                  </tr>
                ) : diagnostics.length ? (
                  diagnostics.slice(0, 20).map((d) => (
                    <tr key={`${d.symbol}-${d.source}-${d.reason}`} className="border-t border-gray-100">
                      <td className="py-2 font-medium text-gray-900">{d.symbol}</td>
                      <td className="py-2 text-right text-gray-700">₹{d.lastPrice.toFixed(2)}</td>
                      <td className={`py-2 text-right ${d.movePct >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
                        {d.movePct >= 0 ? "+" : ""}
                        {d.movePct.toFixed(2)}%
                      </td>
                      <td className="py-2 text-right text-gray-600">
                        +{Math.abs(status?.config?.buyTriggerPct ?? 0).toFixed(2)}%
                      </td>
                      <td className="py-2 text-right text-gray-600">
                        {(status?.config?.sellTriggerPct ?? 0).toFixed(2)}%
                      </td>
                      <td className="py-2">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                            d.action === "BUY"
                              ? "bg-emerald-100 text-emerald-700"
                              : d.action === "SELL"
                                ? "bg-rose-100 text-rose-700"
                                : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {d.action}
                        </span>
                      </td>
                      <td className="py-2 text-gray-600">{d.source === "day" ? "Day fallback" : "Tick"}</td>
                      <td className="py-2 text-gray-600">{d.reason}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="py-3 text-gray-500">
                      No diagnostics yet. Run one cycle to inspect decisions.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900">Decision Summary</h3>
          <div className="mt-3 grid gap-2 text-xs">
            <div className="rounded-lg border border-gray-100 bg-gray-50 p-2.5">
              <p className="text-gray-500">Current trigger band</p>
              <p className="mt-1 font-semibold text-gray-900">
                BUY when move {">="} {(status?.config?.buyTriggerPct ?? 0).toFixed(2)}% | SELL when move {"<="}{" "}
                {(status?.config?.sellTriggerPct ?? 0).toFixed(2)}%
              </p>
            </div>
            <div className="rounded-lg border border-gray-100 bg-gray-50 p-2.5">
              <p className="text-gray-500">Adaptive mode</p>
              <p className="mt-1 font-semibold text-gray-900">
                {status?.config?.adaptiveMode ? "Enabled" : "Disabled"} · Target trades per cycle:{" "}
                {status?.config?.targetTradesPerCycle ?? "--"}
              </p>
            </div>
            <div className="rounded-lg border border-gray-100 bg-gray-50 p-2.5">
              <p className="text-gray-500">Top skip reasons</p>
              {skipReasonSummary.length ? (
                <ul className="mt-1 space-y-1">
                  {skipReasonSummary.map((item) => (
                    <li key={item.reason} className="flex items-center justify-between gap-2 text-gray-700">
                      <span className="truncate">{item.reason}</span>
                      <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-gray-800">
                        {item.count}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-1 text-gray-600">No skip diagnostics yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-[1.1fr_1fr]">
        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900">Strategy Config</h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="text-xs font-medium text-gray-600 sm:col-span-2">
              Companies / Symbols
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setPickerOpen(true)}
                  className="app-btn app-btn-secondary px-3 py-2 text-xs font-semibold text-gray-800"
                >
                  Select Companies
                </button>
                <span className="rounded-lg bg-gray-100 px-3 py-2 text-xs text-gray-700">
                  {selectedSymbols.length} selected
                </span>
              </div>
              <input
                value={symbols}
                onChange={(e) => setSymbols(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                placeholder="RELIANCE,TCS,INFY"
              />
              <div className="mt-2 flex flex-wrap gap-1.5">
                {selectedSymbols.slice(0, 12).map((s) => (
                  <span key={s} className="rounded-full border border-gray-200 bg-gray-50 px-2 py-1 text-[10px] font-medium text-gray-700">
                    {s}
                  </span>
                ))}
              </div>
            </label>
            <label className="text-xs font-medium text-gray-600">
              Interval (sec)
              <input value={intervalSec} readOnly className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-600" />
              <p className="mt-1 text-[10px] text-gray-500">Fixed to 300s for full automatic execution.</p>
            </label>
            <label className="text-xs font-medium text-gray-600">
              Trade Qty
              <input value={tradeQty} onChange={(e) => setTradeQty(e.target.value)} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
            </label>
            <label className="text-xs font-medium text-gray-600">
              Buy Trigger (%)
              <input value={buyTriggerPct} onChange={(e) => setBuyTriggerPct(e.target.value)} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
            </label>
            <label className="text-xs font-medium text-gray-600">
              Sell Trigger (%)
              <input value={sellTriggerPct} onChange={(e) => setSellTriggerPct(e.target.value)} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
            </label>
            <label className="text-xs font-medium text-gray-600">
              Max Position / Symbol
              <input
                value={maxPositionPerSymbol}
                onChange={(e) => setMaxPositionPerSymbol(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </label>
            <label className="text-xs font-medium text-gray-600">
              Max Loss Guard (INR)
              <input value={maxDailyLoss} onChange={(e) => setMaxDailyLoss(e.target.value)} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
            </label>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void startEngine()}
              disabled={busyAction !== null}
              className="app-btn app-btn-primary px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busyAction === "start" ? "Starting..." : "Start Engine"}
            </button>
            <button
              type="button"
              onClick={() => void stopEngine()}
              disabled={busyAction !== null}
              className="app-btn app-btn-secondary px-4 py-2 text-sm font-semibold text-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busyAction === "stop" ? "Stopping..." : "Stop Engine"}
            </button>
          </div>
          {message ? <p className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">{message}</p> : null}
          {error ? <p className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">{error}</p> : null}
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900">Engine Timeline</h3>
          <div className="mt-3 space-y-2 text-xs text-gray-600">
            <p>
              Started:{" "}
              <span className="font-medium text-gray-900">
                {status?.startedAt ? new Date(status.startedAt).toLocaleString() : "--"}
              </span>
            </p>
            <p>
              Last cycle:{" "}
              <span className="font-medium text-gray-900">
                {status?.lastRunAt ? new Date(status.lastRunAt).toLocaleString() : "--"}
              </span>
            </p>
            <p>
              Last message:{" "}
              <span className="font-medium text-gray-900">{status?.lastMessage ?? "--"}</span>
            </p>
            <p>
              Performance as of:{" "}
              <span className="font-medium text-gray-900">
                {performance?.asOf ? new Date(performance.asOf).toLocaleTimeString() : "--"}
              </span>
            </p>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[650px] text-left text-xs">
              <thead className="text-gray-500">
                <tr>
                  <th className="pb-2">Time</th>
                  <th className="pb-2">Symbol</th>
                  <th className="pb-2">Side</th>
                  <th className="pb-2 text-right">Qty</th>
                  <th className="pb-2 text-right">Price</th>
                  <th className="pb-2 text-right">Move</th>
                  <th className="pb-2">Reason</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-3 text-gray-500">
                      Loading...
                    </td>
                  </tr>
                ) : status?.recentEvents?.length ? (
                  status.recentEvents.slice(0, 8).map((t) => (
                    <tr key={t.id} className="border-t border-gray-100">
                      <td className="py-2 text-gray-600">{new Date(t.at).toLocaleTimeString()}</td>
                      <td className="py-2 font-medium text-gray-900">{t.symbol}</td>
                      <td className={`py-2 ${t.side === "BUY" ? "text-emerald-700" : "text-rose-700"}`}>{t.side}</td>
                      <td className="py-2 text-right text-gray-700">{t.quantity}</td>
                      <td className="py-2 text-right text-gray-700">₹{t.price.toFixed(2)}</td>
                      <td className={`py-2 text-right ${t.movePct >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
                        {t.movePct >= 0 ? "+" : ""}
                        {t.movePct.toFixed(2)}%
                      </td>
                      <td className="py-2 text-gray-600">{t.reason}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-3 text-gray-500">
                      No engine events yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}

