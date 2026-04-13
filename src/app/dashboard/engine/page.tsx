"use client";

import AutomationPanel from "@/components/dashboard/AutomationPanel";
import DashboardHero from "@/components/dashboard/DashboardHero";
import AppContainer from "@/components/ui/AppContainer";

export default function EnginePage() {
  return (
    <AppContainer as="main" className="max-w-7xl py-8">
      <DashboardHero
        eyebrow="Strategy Workspace"
        title="Automation Engine Control Center"
        description="Configure strategy, run cycles, and inspect each decision with side-by-side trigger comparisons and reasons."
      />
      <AutomationPanel />
    </AppContainer>
  );
}

