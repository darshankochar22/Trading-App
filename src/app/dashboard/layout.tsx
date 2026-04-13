import type { ReactNode } from "react";
import Navbar from "@/components/Navbar/Navbar";
import MarketTickerBar from "@/components/market/MarketTickerBar";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-white text-black">
      <Navbar />
      <MarketTickerBar />
      {children}
    </div>
  );
}

