"use client";

import AutomationPanel from "@/components/dashboard/AutomationPanel";

export default function EnginePage() {
  return (
    <main className="mx-auto w-full max-w-7xl px-6 py-8">
      <div className="rounded-2xl border border-gray-200 bg-black p-6 text-white shadow-sm">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-200">
          Strategy Workspace
        </p>
        <h1 className="mt-3 text-2xl font-semibold sm:text-3xl">
          Automation Engine Control Center
        </h1>
        <p className="mt-1 text-sm text-slate-200">
          Configure strategy, run cycles, and inspect each decision with side-by-side
          trigger comparisons and reasons.
        </p>
      </div>
      <AutomationPanel />
    </main>
  );
}

