import Link from "next/link";
import type { MarketIndex } from "@/types/market";

type Props = {
  item: MarketIndex;
};

export default function MarketIndexCard({ item }: Props) {
  const positive = item.percentChange >= 0;

  return (
    <Link
      href={`/dashboard/indices/${item.key}`}
      className="app-card block rounded-2xl p-5 shadow-sm transition hover:-translate-y-0.5 hover:bg-gray-50/40 hover:shadow-md"
    >
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{item.name}</p>
      <p className="mt-2 text-3xl font-semibold tracking-tight text-gray-900">
        {item.value.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
      </p>
      <div className={`app-badge mt-2 inline-flex items-center px-2.5 py-1 text-xs font-semibold ${positive ? "app-badge-success" : "app-badge-danger"}`}>
        {positive ? "+" : ""}
        {item.change.toFixed(2)} ({item.percentChange.toFixed(2)}%)
      </div>
    </Link>
  );
}

