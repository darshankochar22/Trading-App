import Link from "next/link";
import AppTopShell from "@/components/layout/AppTopShell";
import AppContainer from "@/components/ui/AppContainer";
import RiskDashboardPanel from "@/components/quant/RiskDashboardPanel";

export default function QuantRiskPage() {
  return (
    <div className="app-page">
      <AppTopShell />
      <AppContainer as="main" className="max-w-7xl py-10">
        <section className="app-card-elevated rounded-3xl bg-zinc-950 p-8 text-white">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-zinc-300">Quant Module 02</p>
              <h1 className="app-display mt-3 text-5xl text-white">Risk Dashboard</h1>
              <p className="mt-3 max-w-2xl text-sm text-zinc-300">
                Live exposure, concentration, VaR estimates, and stress scenarios from
                your paper-trading portfolio and execution logs.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/quant" className="app-btn app-btn-secondary border-white/30 bg-white/5 text-white hover:bg-white/10">
                Quant Hub
              </Link>
              <Link href="/quant/strategy-lab" className="app-btn bg-white text-black hover:bg-zinc-100">
                Strategy Lab
              </Link>
              <Link href="/quant/execution-lab" className="app-btn app-btn-secondary border-white/30 bg-white/5 text-white hover:bg-white/10">
                Execution Lab
              </Link>
            </div>
          </div>
        </section>
        <div className="mt-6">
          <RiskDashboardPanel />
        </div>
      </AppContainer>
    </div>
  );
}
