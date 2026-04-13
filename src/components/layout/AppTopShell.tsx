import Navbar from "@/components/Navbar/Navbar";
import MarketTickerBar from "@/components/market/MarketTickerBar";

type AppTopShellProps = {
  showTicker?: boolean;
};

export default function AppTopShell({ showTicker = true }: AppTopShellProps) {
  return (
    <div className="w-full border-b border-black/5 bg-white">
      <Navbar />
      {showTicker ? <MarketTickerBar /> : null}
    </div>
  );
}
