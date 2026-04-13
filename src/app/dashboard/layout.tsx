import type { ReactNode } from "react";
import AppTopShell from "@/components/layout/AppTopShell";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="app-page">
      <AppTopShell />
      {children}
    </div>
  );
}

