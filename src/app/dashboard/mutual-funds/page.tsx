"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { MutualFundItem, MutualFundMetrics } from "@/types/market";

type MfApi = {
  ok: boolean;
  data?: MutualFundItem[];
  message?: string;
};

type MfMetricsApi = {
  ok: boolean;
  data?: Record<string, MutualFundMetrics>;
};

type SipPlan = {
  id: string;
  fundCode: string;
  fundName: string;
  monthlyAmount: number;
  expectedAnnualReturn: number;
  dayOfMonth: number;
  startDate: string;
  status: "ACTIVE" | "PAUSED";
};

export default function MutualFundsPage() {
  const [query, setQuery] = useState("");
  const [funds, setFunds] = useState<MutualFundItem[]>([]);
  const [sortBy, setSortBy] = useState<"name-asc" | "name-desc" | "code-asc" | "code-desc">("name-asc");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sipError, setSipError] = useState<string | null>(null);
  const [sipSuccess, setSipSuccess] = useState<string | null>(null);
  const [fundMetrics, setFundMetrics] = useState<Record<string, MutualFundMetrics>>({});

  const [monthlySip, setMonthlySip] = useState("5000");
  const [annualReturn, setAnnualReturn] = useState("12");
  const [years, setYears] = useState("10");
  const [sipPlans, setSipPlans] = useState<SipPlan[]>([]);
  const [dayOfMonth, setDayOfMonth] = useState("5");
  const [selectedFund, setSelectedFund] = useState<MutualFundItem | null>(null);
  const [isAuthed, setIsAuthed] = useState<boolean | null>(null);
  const [upiOpen, setUpiOpen] = useState(false);
  const [upiPin, setUpiPin] = useState("");
  const [upiStep, setUpiStep] = useState<"pin" | "processing" | "success">("pin");
  const [upiTxnId, setUpiTxnId] = useState("");

  useEffect(() => {
    let active = true;
    const id = setTimeout(async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`/api/market/mutual-funds?limit=30&q=${encodeURIComponent(query)}`, {
          cache: "no-store",
        });
        const json: MfApi = await res.json();
        if (!res.ok || !json.ok) throw new Error(json.message ?? "Unable to fetch mutual funds");
        if (!active) return;
        setFunds(json.data ?? []);
      } catch (e) {
        if (!active) return;
        setError(e instanceof Error ? e.message : "Unable to fetch mutual funds");
      } finally {
        if (active) setLoading(false);
      }
    }, 300);
    return () => {
      active = false;
      clearTimeout(id);
    };
  }, [query]);

  useEffect(() => {
    const codes = funds.map((f) => f.code).filter(Boolean).slice(0, 30);
    if (!codes.length) {
      setFundMetrics({});
      return;
    }
    let active = true;
    async function loadMetrics() {
      try {
        const res = await fetch(`/api/market/mutual-funds/metrics?codes=${encodeURIComponent(codes.join(","))}`, {
          cache: "no-store",
        });
        const json: MfMetricsApi = await res.json();
        if (!active || !res.ok || !json.ok) return;
        setFundMetrics((prev) => ({ ...prev, ...(json.data ?? {}) }));
      } catch {
        if (!active) return;
      }
    }
    void loadMetrics();
    return () => {
      active = false;
    };
  }, [funds]);

  useEffect(() => {
    async function loadSips() {
      const meRes = await fetch("/api/auth/me", { cache: "no-store" });
      const meJson = await meRes.json();
      const authed = Boolean(meJson?.user);
      setIsAuthed(authed);
      if (!authed) {
        setSipPlans([]);
        return;
      }
      const res = await fetch("/api/user/sips", { cache: "no-store" });
      const json = await res.json();
      if (json?.ok) setSipPlans(json.data ?? []);
    }
    void loadSips();
  }, []);

  useEffect(() => {
    const codes = sipPlans.map((p) => p.fundCode).filter(Boolean);
    if (!codes.length) return;
    let active = true;
    async function loadSipMetrics() {
      try {
        const res = await fetch(`/api/market/mutual-funds/metrics?codes=${encodeURIComponent(codes.join(","))}`, {
          cache: "no-store",
        });
        const json: MfMetricsApi = await res.json();
        if (!active || !res.ok || !json.ok) return;
        setFundMetrics((prev) => ({ ...prev, ...(json.data ?? {}) }));
      } catch {
        if (!active) return;
      }
    }
    void loadSipMetrics();
    return () => {
      active = false;
    };
  }, [sipPlans]);

  function formatReturn(value: number | null | undefined) {
    if (value === null || value === undefined || !Number.isFinite(value)) return "--";
    const sign = value > 0 ? "+" : "";
    return `${sign}${value.toFixed(2)}%`;
  }

  const sortedFunds = useMemo(() => {
    const list = [...funds];
    const byName = (a: MutualFundItem, b: MutualFundItem) => a.schemeName.localeCompare(b.schemeName);
    const byCode = (a: MutualFundItem, b: MutualFundItem) => a.code.localeCompare(b.code);
    if (sortBy === "name-asc") return list.sort(byName);
    if (sortBy === "name-desc") return list.sort((a, b) => byName(b, a));
    if (sortBy === "code-asc") return list.sort(byCode);
    return list.sort((a, b) => byCode(b, a));
  }, [funds, sortBy]);

  async function startSipForFund(fund: MutualFundItem) {
    if (!isAuthed) {
      setSipError("Please login to start SIP plans.");
      return;
    }
    setSipError(null);
    setSipSuccess(null);
    setSelectedFund(fund);
    setUpiPin("");
    setUpiTxnId(`TXN${Date.now().toString().slice(-8)}`);
    setUpiStep("pin");
    setUpiOpen(true);
  }

  async function confirmUpiAndCreateSip() {
    if (!selectedFund) return;
    setUpiStep("processing");
    await new Promise((resolve) => setTimeout(resolve, 1200));
    try {
      const res = await fetch("/api/user/sips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fundCode: selectedFund.code,
          fundName: selectedFund.schemeName,
          monthlyAmount: Number(monthlySip),
          expectedAnnualReturn: Number(annualReturn),
          dayOfMonth: Number(dayOfMonth),
          startDate: new Date().toISOString(),
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.message ?? "Unable to create SIP plan");
      setUpiStep("success");
      setSipSuccess(`SIP started for ${selectedFund.schemeName}`);
      const listRes = await fetch("/api/user/sips", { cache: "no-store" });
      const listJson = await listRes.json();
      if (listJson?.ok) setSipPlans(listJson.data ?? []);
      setTimeout(() => setUpiOpen(false), 1300);
    } catch (e) {
      setUpiOpen(false);
      setSipError(e instanceof Error ? e.message : "Unable to create SIP plan");
    }
  }

  async function toggleSip(id: string, status: "ACTIVE" | "PAUSED") {
    if (!isAuthed) return;
    await fetch("/api/user/sips", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    setSipPlans((prev) => prev.map((p) => (p.id === id ? { ...p, status } : p)));
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

  return (
    <main className="mx-auto w-full max-w-7xl px-6 py-10">
      {upiOpen ? (
        <div className="fixed inset-0 z-70 flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-5 shadow-xl">
            {upiStep === "pin" ? (
              <>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">UPI Payment</p>
                <h3 className="mt-2 text-lg font-semibold text-gray-900">Approve SIP mandate</h3>
                <p className="mt-1 text-sm text-gray-600">
                  Fund: <span className="font-medium text-gray-900">{selectedFund?.schemeName}</span>
                </p>
                <p className="mt-1 text-sm text-gray-600">
                  Amount: <span className="font-medium text-gray-900">₹{Number(monthlySip || 0).toLocaleString("en-IN")}</span>
                </p>
                <p className="mt-1 text-xs text-gray-500">Enter UPI PIN to continue (dummy flow, always success).</p>

                <div className="mt-4">
                  <div className="flex items-center justify-center gap-2">
                    {Array.from({ length: 6 }).map((_, idx) => (
                      <div
                        key={`pin-box-${idx}`}
                        className={`flex h-10 w-9 items-center justify-center rounded-md border text-sm font-semibold ${
                          idx < upiPin.length
                            ? "border-blue-400 bg-blue-50 text-blue-700"
                            : "border-gray-300 bg-gray-50 text-gray-300"
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
                    <button
                      type="button"
                      onClick={clearPin}
                      className="rounded-lg border border-gray-200 bg-white py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Clear
                    </button>
                    <button
                      type="button"
                      onClick={() => pressPinDigit("0")}
                      className="rounded-lg border border-gray-200 bg-white py-2 text-sm font-medium text-gray-900 hover:bg-gray-50"
                    >
                      0
                    </button>
                    <button
                      type="button"
                      onClick={backspacePin}
                      className="rounded-lg border border-gray-200 bg-white py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
                    >
                      ⌫
                    </button>
                  </div>
                </div>
                <div className="mt-4 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setUpiOpen(false)}
                    className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => void confirmUpiAndCreateSip()}
                    disabled={upiPin.length < 4}
                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Pay & Activate SIP
                  </button>
                </div>
              </>
            ) : null}

            {upiStep === "processing" ? (
              <div className="py-6 text-center">
                <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600" />
                <p className="mt-3 text-sm font-medium text-gray-900">Processing payment...</p>
                <p className="mt-1 text-xs text-gray-500">Please do not close this window.</p>
              </div>
            ) : null}

            {upiStep === "success" ? (
              <div className="py-5 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-white shadow-md shadow-blue-200">
                  ✓
                </div>
                <p className="mt-3 text-sm font-semibold text-gray-900">Payment successful</p>
                <p className="mt-1 text-xs text-gray-500">UPI Ref: {upiTxnId}</p>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="rounded-2xl border border-gray-200 bg-black p-6 text-white shadow-sm">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-200">Mutual Funds</p>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold sm:text-3xl">SIP Planner & Fund Discovery</h1>
            <p className="mt-1 text-sm text-slate-200">
              Professional mutual fund section with SIP projection and searchable fund universe.
            </p>
          </div>
          <Link href="/dashboard" className="rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm hover:bg-white/10">
            Back to Dashboard
          </Link>
        </div>
      </div>

      <section className="mt-6 grid gap-4 lg:grid-cols-[380px_1fr]">
        <article className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-900">SIP Calculator</h2>
          <p className="mt-1 text-xs text-gray-500">Estimate long-term corpus with monthly SIP.</p>

          <div className="mt-4 space-y-3">
            <label className="block text-xs font-medium text-gray-600">
              Monthly SIP (INR)
              <input
                value={monthlySip}
                onChange={(e) => setMonthlySip(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </label>

            <label className="block text-xs font-medium text-gray-600">
              Expected return (% p.a.)
              <input
                value={annualReturn}
                onChange={(e) => setAnnualReturn(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </label>

            <label className="block text-xs font-medium text-gray-600">
              Investment period (years)
              <input
                value={years}
                onChange={(e) => setYears(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </label>
            <label className="block text-xs font-medium text-gray-600">
              SIP day of month (1-28)
              <input
                value={dayOfMonth}
                onChange={(e) => setDayOfMonth(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </label>
          </div>

          {selectedFund ? (
            <p className="mt-3 text-xs text-gray-600">
              Selected for SIP setup: <span className="font-medium text-gray-900">{selectedFund.schemeName}</span>
            </p>
          ) : null}
        </article>

        <article className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Fund Explorer</h2>
              <p className="mt-1 text-xs text-gray-500">Search across mutual fund schemes.</p>
            </div>
            <div className="flex w-full max-w-xl gap-2">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search scheme name..."
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
              <select
                value={sortBy}
                onChange={(e) =>
                  setSortBy((e.target.value as "name-asc" | "name-desc" | "code-asc" | "code-desc") ?? "name-asc")
                }
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="name-asc">Name A-Z</option>
                <option value="name-desc">Name Z-A</option>
                <option value="code-asc">Code A-Z</option>
                <option value="code-desc">Code Z-A</option>
              </select>
            </div>
          </div>

          {error ? <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
          {sipError ? <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{sipError}</p> : null}
          {sipSuccess ? <p className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{sipSuccess}</p> : null}
          {isAuthed === false ? (
            <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
              Login required for SIP actions. You can still browse and sort funds.
            </p>
          ) : null}

          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="py-2">Scheme Name</th>
                  <th className="py-2">Code</th>
                  <th className="py-2 text-right">Latest NAV</th>
                  <th className="py-2 text-right">1Y Return</th>
                  <th className="py-2 text-right">3Y Return</th>
                  <th className="py-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 8 }).map((_, idx) => (
                    <tr key={`mf-loading-${idx}`} className="border-t border-gray-100">
                      <td className="py-3">
                        <div className="h-3 w-56 animate-pulse rounded bg-gray-200" />
                      </td>
                      <td className="py-3">
                        <div className="h-3 w-20 animate-pulse rounded bg-gray-200" />
                      </td>
                      <td className="py-3">
                        <div className="ml-auto h-3 w-16 animate-pulse rounded bg-gray-200" />
                      </td>
                      <td className="py-3">
                        <div className="ml-auto h-3 w-16 animate-pulse rounded bg-gray-200" />
                      </td>
                      <td className="py-3">
                        <div className="ml-auto h-3 w-16 animate-pulse rounded bg-gray-200" />
                      </td>
                      <td className="py-3" />
                    </tr>
                  ))
                ) : sortedFunds.length ? (
                  sortedFunds.map((f) => {
                    const metric = fundMetrics[f.code];
                    return (
                      <tr key={f.code} className="border-t border-gray-100">
                        <td className="py-2 font-medium text-gray-900">{f.schemeName}</td>
                        <td className="py-2 text-gray-600">{f.code}</td>
                        <td className="py-2 text-right text-gray-700">
                          {metric ? `₹${metric.latestNav.toFixed(2)}` : "--"}
                          {metric?.navDate ? <p className="text-[10px] text-gray-500">{metric.navDate}</p> : null}
                        </td>
                        <td
                          className={`py-2 text-right ${
                            (metric?.return1Y ?? 0) > 0 ? "text-emerald-700" : (metric?.return1Y ?? 0) < 0 ? "text-rose-700" : "text-gray-700"
                          }`}
                        >
                          {formatReturn(metric?.return1Y)}
                        </td>
                        <td
                          className={`py-2 text-right ${
                            (metric?.return3Y ?? 0) > 0 ? "text-emerald-700" : (metric?.return3Y ?? 0) < 0 ? "text-rose-700" : "text-gray-700"
                          }`}
                        >
                          {formatReturn(metric?.return3Y)}
                        </td>
                        <td className="py-2 text-right">
                          <button
                            type="button"
                            onClick={() => void startSipForFund(f)}
                            disabled={!isAuthed}
                            className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-900 hover:bg-gray-50"
                          >
                            Start SIP
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr className="border-t border-gray-100">
                    <td colSpan={6} className="py-6 text-center text-gray-500">
                      No schemes found for this query.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </article>
      </section>

      <section className="mt-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-gray-900">My SIP Plans</h2>
          <p className="text-xs text-gray-500">{sipPlans.length} plans</p>
        </div>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="py-2">Scheme</th>
                <th className="py-2">Monthly SIP</th>
                <th className="py-2">Latest NAV</th>
                <th className="py-2">1Y Return (actual)</th>
                <th className="py-2">SIP Assumption</th>
                <th className="py-2">SIP Date</th>
                <th className="py-2">Status</th>
                <th className="py-2 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {sipPlans.length ? (
                sipPlans.map((p) => (
                  <tr key={p.id} className="border-t border-gray-100">
                    <td className="py-2">
                      <p className="font-medium text-gray-900">{p.fundName}</p>
                      <p className="text-xs text-gray-500">{p.fundCode}</p>
                    </td>
                    <td className="py-2">₹{p.monthlyAmount.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</td>
                    <td className="py-2 text-gray-700">{fundMetrics[p.fundCode] ? `₹${fundMetrics[p.fundCode].latestNav.toFixed(2)}` : "--"}</td>
                    <td
                      className={`py-2 ${
                        (fundMetrics[p.fundCode]?.return1Y ?? 0) > 0
                          ? "text-emerald-700"
                          : (fundMetrics[p.fundCode]?.return1Y ?? 0) < 0
                            ? "text-rose-700"
                            : "text-gray-700"
                      }`}
                    >
                      {formatReturn(fundMetrics[p.fundCode]?.return1Y)}
                    </td>
                    <td className="py-2 text-gray-700">{p.expectedAnnualReturn.toFixed(1)}%</td>
                    <td className="py-2">{p.dayOfMonth}</td>
                    <td className="py-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          p.status === "ACTIVE" ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="py-2 text-right">
                      <button
                        type="button"
                        onClick={() => void toggleSip(p.id, p.status === "ACTIVE" ? "PAUSED" : "ACTIVE")}
                        className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-900 hover:bg-gray-50"
                      >
                        {p.status === "ACTIVE" ? "Pause" : "Resume"}
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr className="border-t border-gray-100">
                  <td colSpan={8} className="py-6 text-center text-gray-500">
                    No SIP plans yet. Start one from the fund explorer above.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

