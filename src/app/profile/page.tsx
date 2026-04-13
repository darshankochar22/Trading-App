"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import MarketTickerBar from "@/components/market/MarketTickerBar";
import Navbar from "@/components/Navbar/Navbar";
import type { PortfolioSnapshot, TradingStats } from "@/types/trading";

type ProfileApi = {
  ok: boolean;
  data?: {
    profile: { name: string; email: string; plan: string };
    portfolio: PortfolioSnapshot;
    stats: TradingStats;
  };
  asOf?: string;
  message?: string;
};

type DbProfileApi = {
  ok: boolean;
  data?: {
    user: { id: string; email: string; name: string; plan: string };
    account: { cash: number; startingCash: number };
    stats: {
      activeAlerts: number;
      ordersCount: number;
      tradesCount: number;
      holdingsCount: number;
    };
  };
};

type AlertItem = {
  id: string;
  symbol: string;
  targetPrice: number;
  direction: "ABOVE" | "BELOW";
  isActive: boolean;
};

function formatInr(value: number) {
  return value.toLocaleString("en-IN", { maximumFractionDigits: 2 });
}

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<ProfileApi["data"] | null>(null);
  const [dbProfile, setDbProfile] = useState<DbProfileApi["data"] | null>(null);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [alertSymbol, setAlertSymbol] = useState("RELIANCE");
  const [alertPrice, setAlertPrice] = useState("");
  const [alertDirection, setAlertDirection] = useState<"ABOVE" | "BELOW">("ABOVE");
  const [isAuthed, setIsAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch("/api/profile", { cache: "no-store" });
        const json: ProfileApi = await res.json();
        if (!res.ok || !json.ok || !json.data) {
          throw new Error(json.message ?? "Failed to load profile");
        }
        if (!active) return;
        setProfile(json.data);
      } catch (e) {
        if (!active) return;
        setError(e instanceof Error ? e.message : "Unable to load profile");
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    async function loadDbFeatures() {
      const meRes = await fetch("/api/auth/me", { cache: "no-store" });
      const meJson = await meRes.json();
      setIsAuthed(Boolean(meJson?.user));
      if (!meJson?.user) {
        setDbProfile(null);
        setAlerts([]);
        return;
      }
      const [pRes, aRes] = await Promise.all([
        fetch("/api/user/profile", { cache: "no-store" }),
        fetch("/api/user/alerts", { cache: "no-store" }),
      ]);
      const pJson: DbProfileApi = await pRes.json();
      const aJson = await aRes.json();
      if (pJson.ok && pJson.data) setDbProfile(pJson.data);
      if (aJson?.ok) setAlerts(aJson.data ?? []);
    }
    void loadDbFeatures();
  }, []);

  async function addAlert() {
    const target = Number(alertPrice);
    if (!alertSymbol.trim() || !Number.isFinite(target) || target <= 0) return;
    await fetch("/api/user/alerts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ symbol: alertSymbol, targetPrice: target, direction: alertDirection }),
    });
    setAlertPrice("");
    const aRes = await fetch("/api/user/alerts", { cache: "no-store" });
    const aJson = await aRes.json();
    if (aJson?.ok) setAlerts(aJson.data ?? []);
  }

  async function toggleAlert(id: string, isActive: boolean) {
    await fetch("/api/user/alerts", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, isActive }),
    });
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, isActive } : a)));
  }

  async function deleteAlert(id: string) {
    await fetch(`/api/user/alerts?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  }

  const quickActions = useMemo(() => {
    const cash = profile?.portfolio.cash ?? 0;
    const open = profile?.stats.orders.open ?? 0;
    const filled = profile?.stats.orders.filled ?? 0;
    const holdings = profile?.stats.holdingsCount ?? 0;
    return [
      { title: "Balance", value: `₹${formatInr(cash)}`, note: "Same cash as portfolio" },
      { title: "Holdings", value: `${holdings}`, note: "Open positions" },
      { title: "Orders", value: `${open} open`, note: `${filled} filled` },
      { title: "Alerts", value: `${dbProfile?.stats.activeAlerts ?? 0}`, note: "DB-backed price alerts" },
    ] as const;
  }, [dbProfile?.stats.activeAlerts, profile]);

  return (
    <div className="min-h-screen bg-white text-black">
      <Navbar />
      <MarketTickerBar />

      <main className="mx-auto w-full max-w-7xl px-6 py-12">
        {isAuthed === false ? (
          <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <h1 className="text-xl font-semibold text-gray-900">Login required</h1>
            <p className="mt-1 text-sm text-gray-600">Please login to see your profile, balance, and alerts.</p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link
                href="/login"
                className="rounded-xl bg-black px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-900"
              >
                Login
              </Link>
              <Link
                href="/signup"
                className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-900 hover:bg-gray-50"
              >
                Create account
              </Link>
            </div>
          </section>
        ) : null}

        <section className="relative overflow-hidden rounded-3xl bg-zinc-950 text-white">
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(16,185,129,0.14),transparent)]"
            aria-hidden
          />
          <div className="relative px-6 py-10 sm:px-10">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-emerald-200/90">Profile</p>
                <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
                  {dbProfile?.user?.name ? `Welcome back, ${dbProfile.user.name}` : "Welcome back"}
                </h1>
                <p className="mt-2 max-w-2xl text-sm text-zinc-300">
                  Your account overview with live balance, orders, trades, and alerts from your local database.
                </p>
                {error ? (
                  <p className="mt-3 inline-flex rounded-lg border border-red-500/25 bg-red-500/10 px-3 py-2 text-xs text-red-100">
                    {error}
                  </p>
                ) : null}
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs text-zinc-400">Account</p>
                <p className="mt-1 text-sm font-semibold text-white">
                  {dbProfile?.user.email ?? profile?.profile?.email ?? (loading ? "Loading..." : "—")}
                </p>
                <p className="mt-1 text-xs text-zinc-400">
                  Plan: {dbProfile?.user.plan ?? profile?.profile?.plan ?? (loading ? "Loading..." : "—")}
                </p>
              </div>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {quickActions.map((a) => (
                <div key={a.title} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                  <p className="text-xs font-medium text-zinc-300">{a.title}</p>
                  <p className="mt-2 text-lg font-semibold text-white">{a.value}</p>
                  <p className="mt-1 text-xs text-zinc-400">{a.note}</p>
                </div>
              ))}
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/dashboard"
                className="rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-zinc-950 transition hover:bg-emerald-400"
              >
                Go to dashboard
              </Link>
              <Link
                href="/dashboard/trade"
                className="rounded-xl border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-white/10"
              >
                Open trade terminal
              </Link>
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-4 lg:grid-cols-3">
          <article className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-900">Payments</h2>
            <p className="mt-1 text-sm text-gray-600">Add funds or withdraw (placeholder).</p>
            <div className="mt-4 grid gap-2">
              <button
                type="button"
                className="rounded-xl bg-black px-4 py-2.5 text-sm font-medium text-white"
              >
                Add funds
              </button>
              <button
                type="button"
                className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-900"
              >
                Withdraw
              </button>
            </div>
          </article>

          <article className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-900">History</h2>
            <p className="mt-1 text-sm text-gray-600">Backend summary from paper engine.</p>
            <div className="mt-4 grid gap-2 text-sm">
              <div className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3">
                <span className="text-gray-600">Total orders</span>
                <span className="font-semibold text-gray-900">{profile?.stats.orders.total ?? 0}</span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3">
                <span className="text-gray-600">Open</span>
                <span className="font-semibold text-gray-900">{profile?.stats.orders.open ?? 0}</span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3">
                <span className="text-gray-600">Filled</span>
                <span className="font-semibold text-gray-900">{profile?.stats.orders.filled ?? 0}</span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3">
                <span className="text-gray-600">Trades</span>
                <span className="font-semibold text-gray-900">{profile?.stats.trades.count ?? 0}</span>
              </div>
            </div>
          </article>

          <article className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-900">Balance breakdown</h2>
            <p className="mt-1 text-sm text-gray-600">Same values as portfolio.</p>
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3">
                <span className="text-gray-600">Available cash</span>
                <span className="font-semibold text-gray-900">₹{formatInr(profile?.portfolio.cash ?? 0)}</span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3">
                <span className="text-gray-600">Invested</span>
                <span className="font-semibold text-gray-900">₹{formatInr(profile?.portfolio.invested ?? 0)}</span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3">
                <span className="text-gray-600">Current value</span>
                <span className="font-semibold text-gray-900">₹{formatInr(profile?.portfolio.currentValue ?? 0)}</span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3">
                <span className="text-gray-600">Total P&amp;L</span>
                <span
                  className={`font-semibold ${(profile?.portfolio.totalPnl ?? 0) >= 0 ? "text-emerald-700" : "text-red-600"}`}
                >
                  {(profile?.portfolio.totalPnl ?? 0) >= 0 ? "+" : ""}₹{formatInr(profile?.portfolio.totalPnl ?? 0)}
                </span>
              </div>
            </div>
          </article>
        </section>

        <section className="mt-8">
          <article className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold text-gray-900">Price Alerts (Local DB)</h2>
              <span className="text-xs text-gray-500">{dbProfile?.stats.activeAlerts ?? 0} active</span>
            </div>
            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-[1fr_1fr_auto_auto]">
              <input
                value={alertSymbol}
                onChange={(e) => setAlertSymbol(e.target.value.toUpperCase())}
                placeholder="Symbol"
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
              <input
                value={alertPrice}
                onChange={(e) => setAlertPrice(e.target.value)}
                placeholder="Target price"
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
              <select
                value={alertDirection}
                onChange={(e) => setAlertDirection((e.target.value as "ABOVE" | "BELOW") ?? "ABOVE")}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="ABOVE">Above</option>
                <option value="BELOW">Below</option>
              </select>
              <button type="button" onClick={addAlert} className="rounded-lg bg-black px-4 py-2 text-sm text-white">
                Create
              </button>
            </div>
            <ul className="mt-3 space-y-2">
              {alerts.map((a) => (
                <li key={a.id} className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2">
                  <p className="text-sm text-gray-800">
                    {a.symbol} {a.direction} ₹{formatInr(a.targetPrice)}{" "}
                    <span className={`ml-1 text-xs ${a.isActive ? "text-emerald-700" : "text-gray-500"}`}>
                      ({a.isActive ? "active" : "paused"})
                    </span>
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => void toggleAlert(a.id, !a.isActive)}
                      className="rounded border border-gray-200 px-2 py-1 text-xs text-gray-700"
                    >
                      {a.isActive ? "Pause" : "Resume"}
                    </button>
                    <button
                      type="button"
                      onClick={() => void deleteAlert(a.id)}
                      className="rounded border border-red-200 px-2 py-1 text-xs text-red-600"
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
              {!alerts.length ? <li className="text-xs text-gray-500">No alerts yet.</li> : null}
            </ul>
          </article>
        </section>
      </main>
    </div>
  );
}

