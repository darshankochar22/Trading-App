import Link from "next/link";

const links = {
  Product: [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Trade terminal", href: "/dashboard/trade" },
    { label: "Portfolio", href: "/dashboard/portfolio" },
    { label: "Orders", href: "/dashboard/orders" },
  ],
  Markets: [
    { label: "Overview", href: "/dashboard" },
    { label: "Trade", href: "/dashboard/trade" },
    { label: "Portfolio", href: "/dashboard/portfolio" },
  ],
  Company: [
    { label: "Home", href: "/" },
    { label: "Dashboard", href: "/dashboard" },
    { label: "Architecture", href: "/dashboard/architecture" },
  ],
  Legal: [
    { label: "Terms", href: "/terms" },
    { label: "Privacy", href: "/privacy" },
    { label: "Risk disclosure", href: "/risk" },
  ],
} as const;

export default function Footer() {
  return (
    <footer className="mt-auto w-full bg-zinc-950 text-white">
      <div className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(16,185,129,0.14),transparent)]"
          aria-hidden
        />
        <div className="relative mx-auto max-w-7xl px-6 pb-16 pt-16 sm:pb-20 sm:pt-20">
          <div className="grid gap-10 lg:grid-cols-[1.25fr_0.75fr_0.75fr_0.75fr_0.75fr]">
            <div>
              <div className="flex items-center gap-3">
                <div>
                  <p className="text-base font-semibold tracking-tight">Stellar</p>
                  <p className="text-xs text-zinc-400">Fast markets. Calm execution.</p>
                </div>
              </div>

              <p className="mt-5 max-w-md text-sm leading-6 text-zinc-300">
                A focused trading workspace with live market feeds, portfolio tracking, and execution tools—built for
                speed without the noise.
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
              </div>
            </div>

            {Object.entries(links).map(([section, items]) => (
              <div key={section}>
                <p className="text-sm font-semibold text-white">{section}</p>
                <ul className="mt-4 space-y-2 text-sm">
                  {items.map((item) => (
                    <li key={item.href}>
                      <Link className="text-zinc-300 transition hover:text-white" href={item.href}>
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-12 rounded-2xl p-6 sm:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-base font-semibold">Get market-ready in minutes</p>
                <p className="mt-1 text-sm text-zinc-300">
                  Open the dashboard and explore live movers, IPOs, and your portfolio—all in one place.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/dashboard"
                  className="rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-zinc-950 transition hover:bg-emerald-400"
                >
                  Open dashboard
                </Link>
                <Link
                  href="/dashboard/trade"
                  className="rounded-xl border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-white/10"
                >
                  Trade terminal
                </Link>
              </div>
            </div>
          </div>

          <div className="mt-10 flex flex-col gap-3 border-t border-white/10 pt-8 text-xs text-zinc-400 sm:flex-row sm:items-center sm:justify-between">
            <p>© {new Date().getFullYear()} Stellar. All rights reserved.</p>
            <p className="max-w-2xl">
              Market data is illustrative and may be delayed. This product is for educational/demo purposes and not
              investment advice.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}

