import Link from "next/link";
import AppTopShell from "@/components/layout/AppTopShell";
import AppContainer from "@/components/ui/AppContainer";
import ExecutionLabPanel from "@/components/quant/ExecutionLabPanel";

export default function ExecutionLabPage() {
  return (
    <div className="app-page">
      <AppTopShell />
      <AppContainer as="main" className="max-w-7xl py-10">
        <section className="app-card-elevated rounded-3xl bg-zinc-950 p-8 text-white">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-zinc-300">Quant Module 03</p>
              <h1 className="app-display mt-3 text-5xl text-white">Execution Lab</h1>
              <p className="mt-3 max-w-2xl text-sm text-zinc-300">
                Simulate TWAP-style sliced execution, compare benchmark vs fill, and inspect
                slippage sensitivity with aggressiveness controls.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/quant" className="app-btn app-btn-secondary border-white/30 bg-white/5 text-white hover:bg-white/10">
                Quant Hub
              </Link>
              <Link href="/quant/risk" className="app-btn bg-white text-black hover:bg-zinc-100">
                Risk Dashboard
              </Link>
            </div>
          </div>
        </section>
        <div className="mt-6">
          <ExecutionLabPanel />
        </div>
      </AppContainer>
    </div>
  );
}
