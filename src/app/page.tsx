"use client";

import Navbar from "@/components/Navbar/Navbar";
import MarketTickerBar from "@/components/market/MarketTickerBar";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

/* ─── GLOBAL STYLES ─── */
const G = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Geist:wght@300;400;500;600&family=Geist+Mono:wght@400;500&display=swap');
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    :root{
      --fs:'Instrument Serif',Georgia,serif;
      --fn:'Geist',system-ui,sans-serif;
      --fm:'Geist Mono',monospace;
      --ink:#0a0a0a;--ink2:#3d3d3d;--ink3:#6b6b6b;--ink4:#9b9b9b;
      --rule:rgba(0,0,0,0.08);--rule2:rgba(0,0,0,0.13);
      --surf:#f7f7f5;--white:#fff;
      --g:#008060;--gb:#f0faf5;--gbr:#b6e4cc;
      --r:#c0392b;--rb:#fff5f5;
      --acc:#0052cc;--ab:#eff4ff;
      --gold:#a67c00;
    }
    body{background:var(--white);color:var(--ink);font-family:var(--fn);-webkit-font-smoothing:antialiased}

    @keyframes slideUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
    @keyframes march{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
    @keyframes ripple{0%{transform:scale(0);opacity:.4}100%{transform:scale(2.5);opacity:0}}
    @keyframes progIn{from{width:0}to{width:var(--w)}}
    @keyframes numIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}

    .a1{animation:slideUp .5s ease both}
    .a2{animation:slideUp .5s .1s ease both}
    .a3{animation:slideUp .5s .2s ease both}
    .a4{animation:slideUp .5s .3s ease both}

    .wrap{max-width:1200px;margin:0 auto;padding:0 32px}
    @media(max-width:768px){.wrap{padding:0 20px}}

    .live-dot{display:inline-block;width:7px;height:7px;background:var(--g);border-radius:50%;position:relative;flex-shrink:0}
    .live-dot::after{content:'';position:absolute;inset:-3px;border-radius:50%;background:var(--g);animation:ripple 1.4s ease-out infinite}

    .tag{display:inline-flex;align-items:center;gap:5px;font-size:11px;font-weight:500;letter-spacing:.07em;text-transform:uppercase;padding:4px 10px;border-radius:999px;border:1px solid var(--rule2);color:var(--ink3);background:var(--white);font-family:var(--fm)}
    .tag.g{border-color:var(--gbr);color:var(--g);background:var(--gb)}
    .tag.b{border-color:#c0d4f5;color:var(--acc);background:var(--ab)}

    .btn-p{display:inline-flex;align-items:center;gap:8px;background:var(--ink);color:var(--white);font-size:14px;font-weight:500;padding:11px 22px;border-radius:10px;text-decoration:none;border:none;cursor:pointer;transition:background .18s,transform .15s,box-shadow .15s;font-family:var(--fn)}
    .btn-p:hover{background:#222;transform:translateY(-1px);box-shadow:0 6px 24px rgba(0,0,0,.14)}
    .btn-gh{display:inline-flex;align-items:center;gap:8px;background:transparent;color:var(--ink2);font-size:14px;font-weight:400;padding:11px 22px;border-radius:10px;text-decoration:none;border:1px solid var(--rule2);cursor:pointer;transition:background .18s,border-color .18s;font-family:var(--fn)}
    .btn-gh:hover{background:var(--surf);border-color:rgba(0,0,0,.18)}

    .tc{background:var(--white);border:1px solid var(--rule);border-radius:16px;overflow:hidden}
    .th{display:grid;padding:11px 20px;border-bottom:1px solid var(--rule);font-size:11px;font-weight:500;letter-spacing:.07em;color:var(--ink4);text-transform:uppercase;font-family:var(--fm)}
    .tb{padding:0 20px}
    .tr{display:grid;align-items:center;padding:13px 0;border-bottom:1px solid var(--rule);cursor:pointer;transition:background .15s;gap:8px}
    .tr:last-child{border-bottom:none}
    .tr:hover{background:var(--surf);margin:0 -20px;padding:13px 20px;border-radius:8px;border-color:transparent}

    .fc{background:var(--white);border:1px solid var(--rule);border-radius:16px;padding:28px;transition:box-shadow .2s,transform .2s,border-color .2s;position:relative;overflow:hidden}
    .fc:hover{box-shadow:0 12px 40px rgba(0,0,0,.08);transform:translateY(-3px);border-color:rgba(0,0,0,.14)}

    .ic{background:var(--white);border:1px solid var(--rule);border-radius:14px;padding:20px 22px;transition:border-color .2s,box-shadow .2s}
    .ic:hover{border-color:rgba(0,0,0,.15);box-shadow:0 4px 20px rgba(0,0,0,.06)}

    .mq-outer{overflow:hidden;white-space:nowrap;border-top:1px solid var(--rule);border-bottom:1px solid var(--rule);background:var(--surf)}
    .mq-inner{display:inline-flex;animation:march 30s linear infinite}
    .mq-inner:hover{animation-play-state:paused}
    .mq-item{display:inline-flex;align-items:center;gap:10px;padding:14px 24px;border-right:1px solid var(--rule);font-size:12px;font-family:var(--fm);color:var(--ink3)}

    .oc-row{display:grid;grid-template-columns:72px 60px 1fr 60px 72px;align-items:center;font-size:12px;padding:7px 16px;gap:4px;border-bottom:1px solid var(--rule);font-family:var(--fm)}
    .oc-row:last-child{border-bottom:none}
    .oc-row.atm{background:#fffce6;border-left:2px solid var(--gold)}
    .oc-head{font-weight:500;color:var(--ink4);font-size:10px;letter-spacing:.07em;text-transform:uppercase}

    .stat-strip{display:grid;grid-template-columns:repeat(4,1fr)}
    .si{padding:36px 28px;border-right:1px solid var(--rule)}
    .si:last-child{border-right:none}
    @media(max-width:768px){.stat-strip{grid-template-columns:1fr 1fr}.si:nth-child(2){border-right:none}.si:nth-child(3){border-right:1px solid var(--rule)}.si:nth-child(3),.si:nth-child(4){border-top:1px solid var(--rule)}}

    .bu{display:inline-flex;align-items:center;gap:3px;background:var(--gb);color:var(--g);border:1px solid var(--gbr);font-size:11px;font-weight:500;border-radius:6px;padding:2px 7px;font-family:var(--fm)}
    .bd{display:inline-flex;align-items:center;gap:3px;background:var(--rb);color:var(--r);border:1px solid #ffd0cc;font-size:11px;font-weight:500;border-radius:6px;padding:2px 7px;font-family:var(--fm)}

    .prog-bg{background:rgba(0,0,0,.06);border-radius:999px;height:2px;overflow:hidden;margin-top:20px}
    .prog-fill{height:100%;border-radius:999px;background:var(--ink);animation:progIn .9s .4s ease both}

    .mkt-grid{display:grid;grid-template-columns:1fr 1fr;gap:20px}
    @media(max-width:768px){.mkt-grid{grid-template-columns:1fr}}
    .feat-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}
    @media(max-width:900px){.feat-grid{grid-template-columns:1fr 1fr}}
    @media(max-width:600px){.feat-grid{grid-template-columns:1fr}}
    .hero-grid{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,460px);gap:56px;align-items:start}
    @media(max-width:1200px){.hero-grid{grid-template-columns:minmax(0,1fr) minmax(0,420px);gap:36px}}
    @media(max-width:1024px){.hero-grid{grid-template-columns:1fr;gap:28px}}
    .hero-right-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
    @media(max-width:640px){.hero-right-grid{grid-template-columns:1fr}}
    .social-proof{display:flex;align-items:center;gap:20px;margin-top:40px;padding-top:28px;border-top:1px solid var(--rule);flex-wrap:wrap}
    .social-proof-item{display:flex;align-items:center}
    .social-proof-divider{width:1px;height:28px;background:var(--rule);margin:0 20px}
    @media(max-width:640px){
      .social-proof{display:grid;grid-template-columns:1fr;gap:14px}
      .social-proof-item{justify-content:flex-start}
      .social-proof-divider{display:none}
    }

    .sl{font-size:11px;font-weight:500;letter-spacing:.1em;text-transform:uppercase;color:var(--ink4);font-family:var(--fm);margin-bottom:14px;display:block}

    .cta-block{background:var(--ink);border-radius:24px;padding:72px 64px;position:relative;overflow:hidden}
    .cta-block::before{content:'';position:absolute;width:500px;height:500px;border-radius:50%;background:rgba(255,255,255,.025);top:-150px;right:-120px;pointer-events:none}
    @media(max-width:768px){.cta-block{padding:48px 32px}}

    .testi{background:var(--white);border:1px solid var(--rule);border-radius:16px;padding:28px;transition:box-shadow .2s}
    .testi:hover{box-shadow:0 8px 32px rgba(0,0,0,.07)}

    .bar-wrap{display:flex;align-items:flex-end;gap:3px;height:40px}
    .bar{border-radius:2px 2px 0 0}
    .landing-top-shell{
      position:sticky;
      top:0;
      z-index:70;
      width:100%;
      background:var(--white);
      border-bottom:1px solid var(--rule);
    }
    .landing-top-shell nav > div{
      max-width:1200px;
      margin:0 auto;
      padding-left:24px;
      padding-right:24px;
    }
    @media(max-width:768px){
      .landing-top-shell nav > div{
        padding-left:16px;
        padding-right:16px;
      }
    }
    .landing-top-shell > div > div{
      max-width:none;
      width:100%;
      margin:0 auto;
      padding-left:0;
      padding-right:0;
      padding-top:7px;
      padding-bottom:7px;
    }
    .landing-top-shell > div > div > div{
      max-width:100%;
      width:100%;
      margin:0 auto;
      padding-left:0;
      padding-right:0;
    }
    @media(max-width:768px){
      .landing-top-shell > div > div{
        padding-left:0;
        padding-right:0;
      }
    }
    .landing-top-shell > nav{
      position:relative !important;
      top:auto !important;
      z-index:50 !important;
    }
    .landing-top-shell > div{
      position:relative !important;
      top:auto !important;
      z-index:40 !important;
    }
    .landing-page-body{padding-bottom:18px}
    ::-webkit-scrollbar{width:0}
  `}</style>
);

/* ─── SPARKLINE ─── */
function Spark({ up, w = 72 }: { up: boolean; w?: number }) {
  return (
    <svg width={w} height={24} viewBox="0 0 72 24">
      <polyline
        points={
          up
            ? "0,20 12,14 24,16 36,6 48,10 60,3 72,1"
            : "0,3 12,8 24,5 36,14 48,11 60,18 72,21"
        }
        fill="none"
        stroke={up ? "var(--g)" : "var(--r)"}
        strokeWidth="1.6"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

/* ─── BAR CHART ─── */
function Bars({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data);
  return (
    <div className="bar-wrap">
      {data.map((v, i) => (
        <div
          key={i}
          className="bar"
          style={{
            width: 5,
            height: `${(v / max) * 40}px`,
            background: color,
            opacity: i === data.length - 1 ? 1 : 0.28,
          }}
        />
      ))}
    </div>
  );
}

/* ─── COUNTER ─── */
function useCounter(target: number, ms = 1300) {
  const [v, sv] = useState(0);
  const ran = useRef(false);
  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    const t0 = Date.now();
    const tick = () => {
      const p = Math.min(1, (Date.now() - t0) / ms);
      sv(Math.round(target * p));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [target, ms]);
  return v;
}

/* ─── DATA ─── */
const INDICES = [
  {
    name: "NIFTY 50",
    val: "24,832.65",
    chg: "+143.20",
    pct: "+0.58%",
    up: true,
  },
  {
    name: "BANK NIFTY",
    val: "52,148.30",
    chg: "+284.55",
    pct: "+0.55%",
    up: true,
  },
  {
    name: "SENSEX",
    val: "81,654.45",
    chg: "−182.30",
    pct: "−0.22%",
    up: false,
  },
  {
    name: "NIFTY IT",
    val: "38,921.70",
    chg: "+512.85",
    pct: "+1.33%",
    up: true,
  },
];

const INSTRUMENTS = [
  {
    sym: "RELIANCE",
    sub: "NSE · EQ",
    ltp: "2,891.40",
    pct: "+1.24%",
    up: true,
  },
  {
    sym: "HDFCBANK",
    sub: "NSE · EQ",
    ltp: "1,654.75",
    pct: "+0.83%",
    up: true,
  },
  { sym: "INFY", sub: "NSE · EQ", ltp: "1,489.30", pct: "−0.41%", up: false },
  { sym: "TCS", sub: "NSE · EQ", ltp: "3,742.90", pct: "+0.67%", up: true },
  {
    sym: "BAJFINANCE",
    sub: "NSE · EQ",
    ltp: "7,218.55",
    pct: "−0.92%",
    up: false,
  },
];

const FEATURES = [
  {
    n: "01",
    title: "Advanced charting",
    body: "100+ indicators, multi-timeframe overlays, drawing tools and pattern recognition — full analysis without switching tabs.",
    tag: "Charts",
  },
  {
    n: "02",
    title: "Option chain pro",
    body: "Live OI buildup, PCR, max pain, and Greeks in one scrollable view. Spot reversals before the crowd does.",
    tag: "F&O",
  },
  {
    n: "03",
    title: "One-click execution",
    body: "Bracket, GTT, and basket orders. From chart to confirmed trade in under 2 seconds — no separate order window.",
    tag: "Trading",
  },
  {
    n: "04",
    title: "Portfolio X-Ray",
    body: "Sector allocation, risk heatmaps, P&L attribution. Know your real exposure, not what you think it is.",
    tag: "Portfolio",
  },
  {
    n: "05",
    title: "Market scanner",
    body: "Scan 4,000+ instruments in real time. Filter by breakouts, volume surges, RSI divergences, and custom criteria.",
    tag: "Discovery",
  },
  {
    n: "06",
    title: "Strategy backtest",
    body: "Replay any strategy on historical data. Sharpe ratio, drawdown, win rate — stress-test before you risk capital.",
    tag: "Research",
  },
];

const OC = [
  {
    co: "3.21L",
    cl: "482.30",
    s: "24600",
    pl: "48.15",
    po: "1.84L",
    atm: false,
  },
  {
    co: "2.94L",
    cl: "334.60",
    s: "24700",
    pl: "72.40",
    po: "2.11L",
    atm: false,
  },
  {
    co: "4.87L",
    cl: "214.85",
    s: "24800",
    pl: "122.70",
    po: "3.56L",
    atm: true,
  },
  {
    co: "2.13L",
    cl: "128.40",
    s: "24900",
    pl: "198.25",
    po: "2.03L",
    atm: false,
  },
  {
    co: "1.76L",
    cl: "68.90",
    s: "25000",
    pl: "298.50",
    po: "1.47L",
    atm: false,
  },
];

const ORDER_ROWS = [
  { label: "Symbol", val: "NIFTY 24800 CE", mono: true },
  { label: "Qty", val: "50 (1 lot)", mono: true },
  { label: "Order type", val: "Bracket order", mono: false },
  { label: "LTP", val: "₹214.85", mono: true },
  { label: "Stoploss", val: "₹190.00 (−11.6%)", mono: true },
  { label: "Target", val: "₹275.00 (+28%)", mono: true },
];

/* ─── INDEX CARD ─── */
function IndexCard({ name, val, chg, pct, up }: (typeof INDICES)[0]) {
  const bars = up
    ? [28, 42, 35, 55, 48, 72, 60, 88, 70, 95, 78, 100]
    : [100, 82, 90, 68, 78, 52, 65, 40, 55, 32, 44, 22];
  return (
    <div className="ic">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 12,
        }}
      >
        <div>
          <div
            style={{
              fontSize: 10,
              fontFamily: "var(--fm)",
              color: "var(--ink4)",
              letterSpacing: ".07em",
              marginBottom: 4,
            }}
          >
            {name}
          </div>
          <div
            style={{
              fontSize: 20,
              fontWeight: 500,
              fontFamily: "var(--fm)",
              letterSpacing: "-.02em",
            }}
          >
            {val}
          </div>
        </div>
        <span className={up ? "bu" : "bd"}>{pct}</span>
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
        }}
      >
        <div
          style={{
            fontSize: 12,
            color: up ? "var(--g)" : "var(--r)",
            fontFamily: "var(--fm)",
          }}
        >
          {chg}
        </div>
        <Bars data={bars} color={up ? "var(--g)" : "var(--r)"} />
      </div>
    </div>
  );
}

/* ═══════ PAGE ═══════ */
export default function Home() {
  const traders = useCounter(4_200_000, 1400);
  const vol = useCounter(24, 1200);

  return (
    <>
      <G />
      <div style={{ minHeight: "100vh", background: "var(--white)" }}>
        <div className="landing-top-shell">
          <div className="w-full">
            <Navbar />
          </div>
          <div className="w-full">
            <MarketTickerBar />
          </div>
        </div>
        <div className="landing-page-body">
          {/* ═══ HERO ═══ */}
          <section
            style={{
              padding: "80px 0 72px",
              borderBottom: "1px solid var(--rule)",
            }}
          >
            <div className="wrap">
              <div className="hero-grid">
                {/* LEFT */}
                <div>
                  <div className="a1" style={{ marginBottom: 22 }}>
                    <span className="tag g">
                      <span
                        className="live-dot"
                        style={{ width: 6, height: 6 }}
                      />
                      Markets open
                    </span>
                  </div>

                  <h1
                    className="a2"
                    style={{
                      fontFamily: "var(--fs)",
                      fontSize: "clamp(3rem,5vw,4.6rem)",
                      fontWeight: 400,
                      lineHeight: 1.06,
                      letterSpacing: "-.025em",
                      marginBottom: 22,
                    }}
                  >
                    The workspace
                    <br />
                    <em>serious traders</em>
                    <br />
                    actually use.
                  </h1>

                  <p
                    className="a3"
                    style={{
                      fontSize: 17,
                      color: "var(--ink3)",
                      lineHeight: 1.65,
                      maxWidth: 440,
                      marginBottom: 34,
                    }}
                  >
                    Charts, live depth, option chain, and portfolio tracking —
                    unified in one fast interface. No more tab switching.
                  </p>

                  <div
                    className="a4"
                    style={{ display: "flex", gap: 10, flexWrap: "wrap" }}
                  >
                    <Link href="/dashboard" className="btn-p">
                      Open terminal
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 14 14"
                        fill="none"
                      >
                        <path
                          d="M2.5 7h9M8 3.5l3.5 3.5L8 10.5"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </Link>
                    <Link href="/dashboard/trade" className="btn-gh">
                      Watch 2-min demo
                    </Link>
                  </div>

                  {/* social proof row */}
                  <div className="social-proof">
                    {[
                      {
                        n: `${traders.toLocaleString("en-IN")}+`,
                        l: "Active traders",
                      },
                      { n: `₹${vol.toFixed(0)}K Cr+`, l: "Daily volume" },
                      { n: "99.98%", l: "Uptime" },
                    ].map((s, i) => (
                      <div key={s.l} className="social-proof-item">
                        {i > 0 && <div className="social-proof-divider" />}
                        <div>
                          <div
                            style={{
                              fontSize: 18,
                              fontWeight: 500,
                              fontFamily: "var(--fm)",
                              color: "var(--ink)",
                              letterSpacing: "-.015em",
                            }}
                          >
                            {s.n}
                          </div>
                          <div
                            style={{
                              fontSize: 12,
                              color: "var(--ink4)",
                              marginTop: 2,
                            }}
                          >
                            {s.l}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* RIGHT — live market panel */}
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 10 }}
                >
                  <div className="hero-right-grid">
                    {INDICES.map((idx) => (
                      <IndexCard key={idx.name} {...idx} />
                    ))}
                  </div>

                  <div className="tc">
                    <div
                      className="th"
                      style={{ gridTemplateColumns: "1fr 96px 78px 72px" }}
                    >
                      <span>Symbol</span>
                      <span style={{ textAlign: "right" }}>LTP</span>
                      <span style={{ textAlign: "right" }}>Change</span>
                      <span style={{ textAlign: "right" }}>7D</span>
                    </div>
                    <div className="tb">
                      {INSTRUMENTS.map((inst) => (
                        <div
                          key={inst.sym}
                          className="tr"
                          style={{ gridTemplateColumns: "1fr 96px 78px 72px" }}
                        >
                          <div>
                            <div
                              style={{
                                fontSize: 13,
                                fontWeight: 500,
                                fontFamily: "var(--fm)",
                              }}
                            >
                              {inst.sym}
                            </div>
                            <div style={{ fontSize: 11, color: "var(--ink4)" }}>
                              {inst.sub}
                            </div>
                          </div>
                          <div
                            style={{
                              fontFamily: "var(--fm)",
                              fontSize: 13,
                              textAlign: "right",
                            }}
                          >
                            ₹{inst.ltp}
                          </div>
                          <div style={{ textAlign: "right" }}>
                            <span
                              className={inst.up ? "bu" : "bd"}
                              style={{ fontSize: 10, padding: "1px 6px" }}
                            >
                              {inst.pct}
                            </span>
                          </div>
                          <div style={{ textAlign: "right" }}>
                            <Spark up={inst.up} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ═══ MARQUEE TRUST STRIP ═══ */}
          <div className="mq-outer">
            <div className="mq-inner">
              {[...Array(2)].map((_, p) => (
                <span key={p}>
                  {[
                    "NSE certified",
                    "BSE partner",
                    "SEBI registered",
                    "ISO 27001",
                    "256-bit encryption",
                    "₹2.4T+ daily volume",
                    "4.2M+ traders",
                    "<18ms order latency",
                    "99.98% uptime",
                    "Zero-fee demat",
                  ].map((t) => (
                    <span key={t} className="mq-item">
                      <span
                        style={{
                          width: 4,
                          height: 4,
                          borderRadius: "50%",
                          background: "var(--ink4)",
                          display: "inline-block",
                          flexShrink: 0,
                        }}
                      />
                      {t}
                    </span>
                  ))}
                </span>
              ))}
            </div>
          </div>

          {/* ═══ FEATURES ═══ */}
          <section
            style={{ padding: "96px 0", borderBottom: "1px solid var(--rule)" }}
          >
            <div className="wrap">
              <div style={{ maxWidth: 540, marginBottom: 52 }}>
                <span className="sl">Platform capabilities</span>
                <h2
                  style={{
                    fontFamily: "var(--fs)",
                    fontSize: "clamp(2rem,3.5vw,3rem)",
                    fontWeight: 400,
                    lineHeight: 1.12,
                    letterSpacing: "-.02em",
                  }}
                >
                  Every tool you need.
                  <br />
                  <em>Nothing you don't.</em>
                </h2>
              </div>

              <div className="feat-grid">
                {FEATURES.map((f, i) => (
                  <div key={f.title} className="fc">
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        marginBottom: 24,
                      }}
                    >
                      <span
                        style={{
                          fontFamily: "var(--fm)",
                          fontSize: 11,
                          color: "var(--ink4)",
                          letterSpacing: ".06em",
                        }}
                      >
                        {f.n}
                      </span>
                      <span className="tag">{f.tag}</span>
                    </div>
                    <h3
                      style={{
                        fontSize: 16,
                        fontWeight: 500,
                        marginBottom: 10,
                        color: "var(--ink)",
                      }}
                    >
                      {f.title}
                    </h3>
                    <p
                      style={{
                        fontSize: 14,
                        color: "var(--ink3)",
                        lineHeight: 1.65,
                      }}
                    >
                      {f.body}
                    </p>
                    <div className="prog-bg">
                      <div
                        className="prog-fill"
                        style={
                          { "--w": `${58 + i * 7}%` } as React.CSSProperties
                        }
                      />
                    </div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginTop: 7,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 10,
                          color: "var(--ink4)",
                          fontFamily: "var(--fm)",
                        }}
                      >
                        Adoption rate
                      </span>
                      <span
                        style={{
                          fontSize: 10,
                          color: "var(--ink4)",
                          fontFamily: "var(--fm)",
                        }}
                      >
                        {58 + i * 7}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ═══ OPTION CHAIN + ORDER TICKET ═══ */}
          <section
            style={{ padding: "96px 0", borderBottom: "1px solid var(--rule)" }}
          >
            <div className="wrap">
              <div className="mkt-grid">
                {/* Option Chain */}
                <div>
                  <span className="sl">F&O workspace</span>
                  <h2
                    style={{
                      fontFamily: "var(--fs)",
                      fontSize: "clamp(1.6rem,2.4vw,2.4rem)",
                      fontWeight: 400,
                      lineHeight: 1.14,
                      letterSpacing: "-.02em",
                      marginBottom: 8,
                    }}
                  >
                    Option chain that
                    <br />
                    <em>tells the whole story.</em>
                  </h2>
                  <p
                    style={{
                      fontSize: 14,
                      color: "var(--ink3)",
                      lineHeight: 1.65,
                      marginBottom: 24,
                      maxWidth: 380,
                    }}
                  >
                    Live OI, PCR, max pain and Greeks in one view. Built for
                    traders who read the tape, not just the chart.
                  </p>

                  <div className="tc">
                    <div
                      className="oc-row oc-head"
                      style={{ borderBottom: "1px solid var(--rule)" }}
                    >
                      <span style={{ textAlign: "right" }}>OI</span>
                      <span style={{ textAlign: "right" }}>LTP</span>
                      <span
                        style={{ textAlign: "center", color: "var(--ink2)" }}
                      >
                        Strike
                      </span>
                      <span>LTP</span>
                      <span>OI</span>
                    </div>
                    {OC.map((row) => (
                      <div
                        key={row.s}
                        className={`oc-row${row.atm ? " atm" : ""}`}
                      >
                        <span
                          style={{ textAlign: "right", color: "var(--ink3)" }}
                        >
                          {row.co}
                        </span>
                        <span style={{ textAlign: "right" }}>{row.cl}</span>
                        <span
                          style={{
                            textAlign: "center",
                            fontWeight: 500,
                            color: row.atm ? "var(--gold)" : "var(--ink)",
                          }}
                        >
                          {row.s}
                        </span>
                        <span>{row.pl}</span>
                        <span style={{ color: "var(--ink3)" }}>{row.po}</span>
                      </div>
                    ))}
                    <div
                      style={{
                        padding: "10px 16px",
                        borderTop: "1px solid var(--rule)",
                        display: "flex",
                        gap: 16,
                        fontSize: 11,
                        color: "var(--ink4)",
                        fontFamily: "var(--fm)",
                      }}
                    >
                      <span>
                        PCR: <strong style={{ color: "var(--g)" }}>1.42</strong>
                      </span>
                      <span>
                        Max Pain:{" "}
                        <strong style={{ color: "var(--ink2)" }}>24800</strong>
                      </span>
                      <span>
                        IV:{" "}
                        <strong style={{ color: "var(--ink2)" }}>13.4%</strong>
                      </span>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
                    <Link
                      href="/dashboard/trade"
                      className="btn-p"
                      style={{ fontSize: 13, padding: "9px 18px" }}
                    >
                      Open chain →
                    </Link>
                    <Link
                      href="/dashboard"
                      className="btn-gh"
                      style={{ fontSize: 13, padding: "9px 18px" }}
                    >
                      Learn more
                    </Link>
                  </div>
                </div>

                {/* Order Ticket */}
                <div>
                  <span className="sl">Execution</span>
                  <h2
                    style={{
                      fontFamily: "var(--fs)",
                      fontSize: "clamp(1.6rem,2.4vw,2.4rem)",
                      fontWeight: 400,
                      lineHeight: 1.14,
                      letterSpacing: "-.02em",
                      marginBottom: 8,
                    }}
                  >
                    Chart to trade
                    <br />
                    <em>in two seconds.</em>
                  </h2>
                  <p
                    style={{
                      fontSize: 14,
                      color: "var(--ink3)",
                      lineHeight: 1.65,
                      marginBottom: 24,
                      maxWidth: 380,
                    }}
                  >
                    Draw a level, right-click, place a bracket order — all
                    without leaving the chart. Confirmation under 2s.
                  </p>

                  <div className="tc" style={{ padding: 20 }}>
                    {/* buy/sell toggle */}
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: 16,
                        paddingBottom: 14,
                        borderBottom: "1px solid var(--rule)",
                      }}
                    >
                      <div style={{ fontSize: 13, fontWeight: 500 }}>
                        Place order
                      </div>
                      <div
                        style={{
                          display: "flex",
                          background: "var(--surf)",
                          borderRadius: 8,
                          overflow: "hidden",
                          border: "1px solid var(--rule)",
                        }}
                      >
                        {["Buy", "Sell"].map((t, i) => (
                          <div
                            key={t}
                            style={{
                              padding: "5px 18px",
                              fontSize: 12,
                              fontWeight: 500,
                              cursor: "pointer",
                              background: i === 0 ? "var(--g)" : "transparent",
                              color: i === 0 ? "var(--white)" : "var(--ink4)",
                            }}
                          >
                            {t}
                          </div>
                        ))}
                      </div>
                    </div>

                    {ORDER_ROWS.map((row) => (
                      <div
                        key={row.label}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          padding: "8px 0",
                          borderBottom: "1px solid var(--rule)",
                          fontSize: 13,
                        }}
                      >
                        <span style={{ color: "var(--ink4)" }}>
                          {row.label}
                        </span>
                        <span
                          style={{
                            fontFamily: row.mono ? "var(--fm)" : "var(--fn)",
                            fontWeight: 500,
                          }}
                        >
                          {row.val}
                        </span>
                      </div>
                    ))}

                    {/* margin pill */}
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        padding: "10px 0 0",
                        fontSize: 12,
                        color: "var(--ink4)",
                      }}
                    >
                      <span>Required margin</span>
                      <span
                        style={{ fontFamily: "var(--fm)", color: "var(--ink)" }}
                      >
                        ₹10,742
                      </span>
                    </div>

                    <button
                      className="btn-p"
                      style={{
                        width: "100%",
                        justifyContent: "center",
                        background: "var(--g)",
                        marginTop: 14,
                        fontSize: 13,
                        borderRadius: 8,
                      }}
                    >
                      Buy · ₹10,742
                    </button>
                    <div
                      style={{
                        marginTop: 10,
                        textAlign: "center",
                        fontSize: 11,
                        color: "var(--ink4)",
                        fontFamily: "var(--fm)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 6,
                      }}
                    >
                      <span
                        className="live-dot"
                        style={{ width: 5, height: 5 }}
                      />
                      NSE Direct · ~18ms latency
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ═══ STATS STRIP ═══ */}
          <section style={{ borderBottom: "1px solid var(--rule)" }}>
            <div className="stat-strip">
              {[
                { n: "₹2.4T+", l: "Daily volume", s: "across NSE & BSE" },
                { n: "4.2M+", l: "Active traders", s: "growing 40% YoY" },
                { n: "99.98%", l: "Platform uptime", s: "over 24 months" },
                { n: "<18ms", l: "Order latency", s: "median, co-located" },
              ].map((s) => (
                <div key={s.l} className="si">
                  <div
                    style={{
                      fontFamily: "var(--fm)",
                      fontSize: 28,
                      fontWeight: 500,
                      letterSpacing: "-.02em",
                      marginBottom: 6,
                    }}
                  >
                    {s.n}
                  </div>
                  <div
                    style={{ fontSize: 14, fontWeight: 500, marginBottom: 3 }}
                  >
                    {s.l}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--ink4)" }}>
                    {s.s}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ═══ TESTIMONIALS ═══ */}
          <section
            style={{ padding: "96px 0", borderBottom: "1px solid var(--rule)" }}
          >
            <div className="wrap">
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-end",
                  marginBottom: 44,
                  flexWrap: "wrap",
                  gap: 16,
                }}
              >
                <div>
                  <span className="sl">Community</span>
                  <h2
                    style={{
                      fontFamily: "var(--fs)",
                      fontSize: "clamp(2rem,3vw,2.8rem)",
                      fontWeight: 400,
                      letterSpacing: "-.02em",
                    }}
                  >
                    Traders trust it.
                    <br />
                    <em>Daily.</em>
                  </h2>
                </div>
                <div style={{ display: "flex", gap: 3, alignItems: "center" }}>
                  {[...Array(5)].map((_, i) => (
                    <svg
                      key={i}
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="#e9a800"
                    >
                      <path d="M8 1l1.8 4.2L14.5 6l-3.3 3.1.8 4.4L8 11.3l-3.9 2.2.8-4.4L1.5 6l4.7-.8L8 1z" />
                    </svg>
                  ))}
                  <span
                    style={{
                      fontSize: 13,
                      color: "var(--ink4)",
                      marginLeft: 8,
                      fontFamily: "var(--fm)",
                    }}
                  >
                    4.9 · 120k reviews
                  </span>
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))",
                  gap: 14,
                }}
              >
                {[
                  {
                    q: "Switched from three different tools to this one. The option chain alone saves me 40 minutes every morning session.",
                    n: "Arjun Mehta",
                    r: "F&O Trader · Mumbai",
                    i: "AM",
                  },
                  {
                    q: "The chart-to-order flow is genuinely different. See a setup, draw levels, place bracket — done. Zero context switching.",
                    n: "Priya Nair",
                    r: "Intraday Trader · Bangalore",
                    i: "PN",
                  },
                  {
                    q: "Portfolio X-Ray showed my real sector exposure. I was way more concentrated than I thought. Changed how I size positions.",
                    n: "Rohit Sharma",
                    r: "Investor · Pune",
                    i: "RS",
                  },
                ].map((t) => (
                  <div key={t.n} className="testi">
                    <p
                      style={{
                        fontSize: 15,
                        lineHeight: 1.72,
                        color: "var(--ink2)",
                        marginBottom: 22,
                        fontFamily: "var(--fs)",
                        fontStyle: "italic",
                      }}
                    >
                      "{t.q}"
                    </p>
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 12 }}
                    >
                      <div
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: "50%",
                          background: "var(--surf)",
                          border: "1px solid var(--rule)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 12,
                          fontWeight: 500,
                          color: "var(--ink3)",
                          flexShrink: 0,
                        }}
                      >
                        {t.i}
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 500 }}>
                          {t.n}
                        </div>
                        <div style={{ fontSize: 12, color: "var(--ink4)" }}>
                          {t.r}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ═══ CTA ═══ */}
          <section style={{ padding: "80px 0 96px" }}>
            <div className="wrap">
              <div className="cta-block">
                <div style={{ position: "relative", zIndex: 1, maxWidth: 600 }}>
                  <h2
                    style={{
                      fontFamily: "var(--fs)",
                      fontSize: "clamp(2.4rem,4vw,3.8rem)",
                      fontWeight: 400,
                      color: "var(--white)",
                      lineHeight: 1.1,
                      letterSpacing: "-.025em",
                      marginBottom: 16,
                    }}
                  >
                    Your edge starts
                    <br />
                    <em style={{ color: "rgba(255,255,255,.5)" }}>
                      the moment you open it.
                    </em>
                  </h2>
                  <p
                    style={{
                      fontSize: 16,
                      color: "rgba(255,255,255,.5)",
                      lineHeight: 1.65,
                      marginBottom: 34,
                      maxWidth: 460,
                    }}
                  >
                    Join 4.2 million traders who've replaced three separate
                    tools with one. Free for 30 days, no card needed.
                  </p>
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <Link
                      href="/dashboard"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 8,
                        background: "var(--white)",
                        color: "var(--ink)",
                        fontFamily: "var(--fn)",
                        fontWeight: 500,
                        fontSize: 14,
                        padding: "12px 24px",
                        borderRadius: 10,
                        textDecoration: "none",
                      }}
                    >
                      Start free — no card needed
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 14 14"
                        fill="none"
                      >
                        <path
                          d="M2.5 7h9M8 3.5l3.5 3.5L8 10.5"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </Link>
                    <Link
                      href="/dashboard/trade"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 8,
                        background: "rgba(255,255,255,.08)",
                        color: "rgba(255,255,255,.7)",
                        fontFamily: "var(--fn)",
                        fontWeight: 400,
                        fontSize: 14,
                        padding: "12px 24px",
                        borderRadius: 10,
                        textDecoration: "none",
                        border: "1px solid rgba(255,255,255,.14)",
                      }}
                    >
                      See pricing
                    </Link>
                  </div>
                  <div
                    style={{
                      marginTop: 24,
                      display: "flex",
                      gap: 20,
                      flexWrap: "wrap",
                    }}
                  >
                    {[
                      "Free 30-day trial",
                      "No credit card",
                      "Cancel anytime",
                    ].map((t) => (
                      <div
                        key={t}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          fontSize: 12,
                          color: "rgba(255,255,255,.4)",
                        }}
                      >
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 12 12"
                          fill="none"
                        >
                          <path
                            d="M2 6l2.5 2.5L10 3"
                            stroke="rgba(255,255,255,0.45)"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        {t}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
