import type { MarketStock } from "@/types/market";

type Props = {
  title: string;
  items: MarketStock[];
  positive: boolean;
};

export default function MoversList({ title, items, positive }: Props) {
  return (
    <section className="app-card rounded-2xl p-4 shadow-sm">
      <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
      <ul className="mt-3 space-y-2">
        {items.map((s) => (
          <li key={s.symbol} className="flex items-center justify-between rounded-lg px-2 py-1.5 hover:bg-gray-50">
            <div>
              <p className="text-sm font-medium text-gray-900">{s.symbol}</p>
              <p className="text-xs text-gray-500">{s.companyName}</p>
            </div>
            <p className={`text-sm font-semibold ${positive ? "text-green-600" : "text-red-600"}`}>
              {positive && s.pChange > 0 ? "+" : ""}
              {s.pChange.toFixed(2)}%
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}

