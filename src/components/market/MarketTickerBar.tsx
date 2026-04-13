"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { MarketOverviewResponse } from "@/types/market";

type TickerItem = {
  key: string;
  label: string;
  value: number;
  percentChange: number;
};

function formatValue(n: number) {
  return n.toLocaleString("en-IN", { maximumFractionDigits: 2 });
}

export default function MarketTickerBar() {
  const [items, setItems] = useState<TickerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [flash, setFlash] = useState<Record<string, "up" | "down">>({});
  const previousRef = useRef<Record<string, number>>({});

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const res = await fetch("/api/market/overview", { cache: "no-store" });
        const json: MarketOverviewResponse = await res.json();
        if (!res.ok || !json.ok) return;

        const topMovers = [...json.stocks]
          .sort((a, b) => Math.abs(b.pChange) - Math.abs(a.pChange))
          .slice(0, 6)
          .map((s) => ({
            key: `stock-${s.symbol}`,
            label: s.symbol,
            value: s.lastPrice,
            percentChange: s.pChange,
          }));

        const next: TickerItem[] = [
          ...json.indices.map((i) => ({
            key: `index-${i.key}`,
            label: i.name,
            value: i.value,
            percentChange: i.percentChange,
          })),
          ...topMovers,
        ];

        if (!active) return;
        setItems(next);
        setLoading(false);

        const changed: Record<string, "up" | "down"> = {};
        for (const item of next) {
          const prev = previousRef.current[item.key];
          if (typeof prev === "number" && prev !== item.value) {
            changed[item.key] = item.value > prev ? "up" : "down";
          }
          previousRef.current[item.key] = item.value;
        }
        if (Object.keys(changed).length > 0) {
          setFlash(changed);
          setTimeout(() => {
            if (!active) return;
            setFlash({});
          }, 1200);
        }
      } catch {
        // Keep silent if feed hiccups.
      }
    }

    load();
    const id = setInterval(load, 20000);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, []);

  const cards = useMemo(() => {
    return items.map((item) => {
      const positive = item.percentChange >= 0;
      const flashState = flash[item.key];
      const flashClass =
        flashState === "up"
          ? "ring-1 ring-emerald-200 bg-emerald-50/70"
          : flashState === "down"
            ? "ring-1 ring-red-200 bg-red-50/70"
            : "bg-white";

      return (
        <div key={item.key} className={`shrink-0 rounded-xl border border-gray-200 px-3 py-1.5 transition ${flashClass}`}>
          <p className="text-[11px] font-medium uppercase tracking-wide text-gray-500">{item.label}</p>
          <div className="mt-0.5 flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-900">{formatValue(item.value)}</span>
            <span className={`text-xs font-semibold ${positive ? "text-emerald-700" : "text-red-600"}`}>
              {positive ? "+" : ""}
              {item.percentChange.toFixed(2)}%
            </span>
          </div>
        </div>
      );
    });
  }, [flash, items]);

  return (
    <div className="sticky top-16 z-40 w-full border-b border-gray-200 bg-white/95 backdrop-blur">
      <div className="w-full overflow-hidden px-0 py-2">
        {loading && items.length === 0 ? (
          <div className="flex gap-2">
            {Array.from({ length: 7 }).map((_, idx) => (
              <div
                key={`skeleton-${idx}`}
                className="shrink-0 rounded-xl border border-gray-200 bg-white px-3 py-1.5"
              >
                <div className="h-3 w-20 animate-pulse rounded bg-gray-200" />
                <div className="mt-2 h-3 w-28 animate-pulse rounded bg-gray-200" />
              </div>
            ))}
          </div>
        ) : (
          <div className="ticker-marquee">
            <div className="ticker-track">
              {cards}
              {cards}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

