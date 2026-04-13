import Navbar from "@/components/Navbar/Navbar";
import MarketTickerBar from "@/components/market/MarketTickerBar";
import Image from "next/image";
import Link from "next/link";
import MarketGlimpse from "@/components/home/MarketGlimpse";
import HomeActionHub from "@/components/home/HomeActionHub";

const TERMINAL_HERO_IMAGE =
  "https://resources.groww.in/web-assets/img/915/terminal-hero-image.webp";
const LANDING_PRODUCT_IMAGE =
  "https://resources.groww.in/web-assets/story_assets/landing-page/home_page/img-frame-2.webp";

export default function Home() {
  return (
    <div className="min-h-screen bg-white text-black">
      <Navbar />
      <MarketTickerBar />

      <section
        className="relative overflow-hidden bg-zinc-950 text-white"
        aria-labelledby="hero-heading"
      >
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(16,185,129,0.12),transparent)]"
          aria-hidden
        />
        <div className="relative mx-auto max-w-7xl px-6 pb-12 pt-8 md:pb-16 md:pt-12">
          <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:gap-12">
            <div className="order-2 flex flex-col justify-center text-center lg:order-1 lg:text-left">
              <h1
                id="hero-heading"
                className="mt-6 text-4xl font-semibold tracking-tight sm:text-5xl lg:text-[2.75rem] lg:leading-[1.1]"
              >
                Charts, market insights, and execution in one workspace.
              </h1>
              <p className="mx-auto mt-5 max-w-xl text-base text-zinc-400 sm:text-lg lg:mx-0">
                Market discovery, live depth, and portfolio tracking—built for
                fast decisions without jumping between tools.
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
                <Link
                  href="/dashboard"
                  className="rounded-lg bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-zinc-950 transition hover:bg-emerald-400"
                >
                  Open dashboard
                </Link>
                <Link
                  href="/dashboard/trade"
                  className="rounded-lg border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-white/10"
                >
                  Trade terminal
                </Link>
              </div>
            </div>

            <div className="order-1 lg:order-2">
              <div className="relative mx-auto aspect-16/11 w-full max-w-2xl lg:max-w-none">
                <Image
                  src={TERMINAL_HERO_IMAGE}
                  alt="Professional trading terminal on a monitor with charts, market insights, and P&amp;L"
                  fill
                  className="object-contain object-center drop-shadow-2xl"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto w-full max-w-7xl px-6 py-16">
        <MarketGlimpse />

        <HomeActionHub />

        <section className="mt-14" aria-labelledby="product-preview-heading">
          <div className="text-center">
            <h2
              id="product-preview-heading"
              className="text-lg font-semibold text-gray-900"
            >
              F&amp;O tools, option chain, and execution—web and mobile
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Real-time data and a focused workflow for discovery and trades.
            </p>
          </div>
          <div className="relative mx-auto mt-8 aspect-16/10 w-full max-w-5xl overflow-hidden rounded-2xl border border-gray-200 bg-gray-950 shadow-xl">
            <Image
              src={LANDING_PRODUCT_IMAGE}
              alt="Trading dashboard showing option chain on desktop and mobile, with order execution"
              fill
              className="object-cover object-center"
              sizes="(max-width: 1024px) 100vw, 1024px"
            />
          </div>
        </section>
      </main>
    </div>
  );
}
