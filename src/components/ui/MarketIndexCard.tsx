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
      className="block rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:bg-gray-50/40 hover:shadow-md"
    >
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{item.name}</p>
      <p className="mt-2 text-3xl font-semibold tracking-tight text-gray-900">
        {item.value.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
      </p>
      <div
        className={`mt-2 inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
          positive ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
        }`}
      >
        {positive ? "+" : ""}
        {item.change.toFixed(2)} ({item.percentChange.toFixed(2)}%)
      </div>
    </Link>
  );
}

