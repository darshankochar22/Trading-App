"use client";

import { useEffect, useState } from "react";
import DashboardHero from "@/components/dashboard/DashboardHero";
import AppContainer from "@/components/ui/AppContainer";
import type { ExecutedTrade, TradeOrder } from "@/types/trading";

export default function OrdersPage() {
  const [orders, setOrders] = useState<TradeOrder[]>([]);
  const [trades, setTrades] = useState<ExecutedTrade[]>([]);
  const [busyId, setBusyId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      setError(null);
      const [ordersRes, tradesRes] = await Promise.all([
        fetch("/api/trading/orders", { cache: "no-store" }),
        fetch("/api/trading/trades", { cache: "no-store" }),
      ]);
      const ordersJson = await ordersRes.json();
      const tradesJson = await tradesRes.json();
      if (!ordersRes.ok || !ordersJson?.ok) throw new Error(ordersJson?.message ?? "Failed to load orders");
      if (!tradesRes.ok || !tradesJson?.ok) throw new Error(tradesJson?.message ?? "Failed to load trades");
      setOrders(ordersJson.data ?? []);
      setTrades(tradesJson.data ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to refresh order book");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let active = true;
    async function boot() {
      if (!active) return;
      await load();
    }
    void boot();
    const id = setInterval(() => {
      if (!active) return;
      void load();
    }, 8000);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, []);

  async function cancel(orderId: string) {
    setBusyId(orderId);
    await fetch("/api/trading/orders/cancel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId }),
    });
    setBusyId("");
    load();
  }

  return (
    <AppContainer as="main" className="max-w-7xl py-10">
      <DashboardHero
        eyebrow="Execution Log"
        title="Orders and Trades"
        description="Track open orders, executions, and complete order lifecycle in one place."
      />
      <div className="mt-3 flex flex-wrap gap-2 text-xs text-gray-700">
        <span className="rounded-full border border-gray-200 bg-white px-3 py-1.5 shadow-sm">
          Auto-refresh: every 8s
        </span>
        <span className="rounded-full border border-gray-200 bg-white px-3 py-1.5 shadow-sm">
          Orders: {orders.length}
        </span>
        <span className="rounded-full border border-gray-200 bg-white px-3 py-1.5 shadow-sm">
          Trades: {trades.length}
        </span>
      </div>
      {loading ? <p className="mt-3 text-xs text-gray-500">Loading latest order flow...</p> : null}
      {error ? <p className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">{error}</p> : null}

      <section className="mt-6 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-900">Order Book</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="text-xs uppercase text-gray-500">
              <tr>
                <th className="py-2">Time</th>
                <th className="py-2">Symbol</th>
                <th className="py-2">Segment</th>
                <th className="py-2">Instrument</th>
                <th className="py-2">Side</th>
                <th className="py-2">Qty</th>
                <th className="py-2">Type</th>
                <th className="py-2">Status</th>
                <th className="py-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-t border-gray-100">
                  <td className="py-2 text-gray-500">{new Date(o.createdAt).toLocaleTimeString()}</td>
                  <td className="py-2 font-medium">{o.symbol}</td>
                  <td className="py-2">{o.segment ?? "EQUITY"}</td>
                  <td className="py-2">{o.instrument ?? "CASH"}</td>
                  <td className={`py-2 font-medium ${o.side === "BUY" ? "text-green-600" : "text-red-600"}`}>{o.side}</td>
                  <td className="py-2">{o.quantity}</td>
                  <td className="py-2">{o.orderType}</td>
                  <td className="py-2">{o.status}</td>
                  <td className="py-2">
                    {o.status === "OPEN" ? (
                      <button
                        onClick={() => cancel(o.id)}
                        disabled={busyId === o.id}
                        className="rounded-md border border-gray-300 px-2 py-1 text-xs hover:bg-gray-50 disabled:opacity-60"
                      >
                        {busyId === o.id ? "Cancelling..." : "Cancel"}
                      </button>
                    ) : (
                      <span className="text-xs text-gray-400">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-900">Executed Trades</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[700px] text-left text-sm">
            <thead className="text-xs uppercase text-gray-500">
              <tr>
                <th className="py-2">Time</th>
                <th className="py-2">Symbol</th>
                <th className="py-2">Segment</th>
                <th className="py-2">Instrument</th>
                <th className="py-2">Side</th>
                <th className="py-2">Qty</th>
                <th className="py-2">Price</th>
                <th className="py-2">Value</th>
              </tr>
            </thead>
            <tbody>
              {trades.map((t) => (
                <tr key={t.id} className="border-t border-gray-100">
                  <td className="py-2 text-gray-500">{new Date(t.createdAt).toLocaleTimeString()}</td>
                  <td className="py-2 font-medium">{t.symbol}</td>
                  <td className="py-2">{t.segment ?? "EQUITY"}</td>
                  <td className="py-2">{t.instrument ?? "CASH"}</td>
                  <td className={`py-2 font-medium ${t.side === "BUY" ? "text-green-600" : "text-red-600"}`}>{t.side}</td>
                  <td className="py-2">{t.quantity}</td>
                  <td className="py-2">{t.price.toFixed(2)}</td>
                  <td className="py-2">{t.value.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </AppContainer>
  );
}
