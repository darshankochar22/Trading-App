import Link from "next/link";
import AppTopShell from "@/components/layout/AppTopShell";
import AppContainer from "@/components/ui/AppContainer";

export default function QuantHubPage() {
  return (
    <div className="app-page">
      <AppTopShell />
      <AppContainer as="main" className="max-w-7xl py-10">
        <section className="app-card-elevated rounded-3xl bg-zinc-950 p-8 text-white">
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-300">Quant Modules</p>
          <h1 className="app-display mt-3 text-5xl text-white">Quant Research Hub</h1>
          <p className="mt-3 max-w-2xl text-sm text-zinc-300">
            Separate routes for research, signal testing, and execution analytics.
            Start with Strategy Lab and expand module-by-module.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/quant/strategy-lab" className="app-btn bg-white text-black hover:bg-zinc-100">
              Open Strategy Lab
            </Link>
            <Link href="/quant/risk" className="app-btn app-btn-secondary border-white/30 bg-white/5 text-white hover:bg-white/10">
              Open Risk Dashboard
            </Link>
            <Link href="/quant/execution-lab" className="app-btn app-btn-secondary border-white/30 bg-white/5 text-white hover:bg-white/10">
              Open Execution Lab
            </Link>
          </div>
        </section>
      </AppContainer>
    </div>
  );
}
