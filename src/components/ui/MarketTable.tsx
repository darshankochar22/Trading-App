import type { MarketStock } from "@/types/market";

type Props = {
  items: MarketStock[];
  title?: string;
};

export default function MarketTable({ items, title = "Listed Companies" }: Props) {
  return (
    <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-100 px-4 py-3">
        <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[780px] text-left text-sm">
          <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-4 py-3">Symbol</th>
              <th className="px-4 py-3">Company</th>
              <th className="px-4 py-3">CMP</th>
              <th className="px-4 py-3">Change</th>
              <th className="px-4 py-3">% Change</th>
              <th className="px-4 py-3">Day Range</th>
            </tr>
          </thead>
          <tbody>
            {items.map((s) => (
              <tr key={s.symbol} className="border-t border-gray-100 hover:bg-gray-50/70">
                <td className="px-4 py-3 font-medium text-gray-900">{s.symbol}</td>
                <td className="px-4 py-3 text-gray-700">{s.companyName}</td>
                <td className="px-4 py-3 text-gray-900">{s.lastPrice.toFixed(2)}</td>
                <td className={`px-4 py-3 font-medium ${s.change >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {s.change >= 0 ? "+" : ""}
                  {s.change.toFixed(2)}
                </td>
                <td className={`px-4 py-3 font-medium ${s.pChange >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {s.pChange >= 0 ? "+" : ""}
                  {s.pChange.toFixed(2)}%
                </td>
                <td className="px-4 py-3 text-gray-700">
                  {s.dayLow.toFixed(2)} - {s.dayHigh.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

