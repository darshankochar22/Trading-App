import type { MarketDepth } from "@/types/market";

type Props = {
  depth: MarketDepth | null;
  loading?: boolean;
};

export default function MarketDepthWidget({ depth, loading }: Props) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <h2 className="text-sm font-semibold text-gray-900">Market Depth / Order Book</h2>
      {loading ? <p className="mt-3 text-sm text-gray-500">Loading depth...</p> : null}
      {!loading && !depth ? <p className="mt-3 text-sm text-gray-500">No depth data.</p> : null}

      {depth ? (
        <>
          <div className="mt-3 text-xs text-gray-500">
            {depth.symbol} | LTP {depth.lastPrice.toFixed(2)} | {depth.pChange.toFixed(2)}%
          </div>
          <div className="mt-3 grid gap-4 md:grid-cols-2">
            <DepthTable title="Bids" rows={depth.bids} positive />
            <DepthTable title="Asks" rows={depth.asks} positive={false} />
          </div>
        </>
      ) : null}
    </section>
  );
}

function DepthTable({
  title,
  rows,
  positive,
}: {
  title: string;
  rows: { price: number; quantity: number; orders: number }[];
  positive: boolean;
}) {
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">{title}</h3>
      <div className="mt-2 overflow-hidden rounded-xl border border-gray-100">
        <table className="w-full text-left text-xs">
          <thead className="bg-gray-50 text-gray-500">
            <tr>
              <th className="px-3 py-2">Price</th>
              <th className="px-3 py-2">Qty</th>
              <th className="px-3 py-2">Orders</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, idx) => (
              <tr key={`${title}-${idx}`} className="border-t border-gray-100">
                <td className={`px-3 py-2 font-medium ${positive ? "text-green-700" : "text-red-700"}`}>
                  {r.price.toFixed(2)}
                </td>
                <td className="px-3 py-2">{r.quantity}</td>
                <td className="px-3 py-2">{r.orders}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

