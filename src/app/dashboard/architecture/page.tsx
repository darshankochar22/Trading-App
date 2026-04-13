"use client";

import Link from "next/link";
import DashboardHero from "@/components/dashboard/DashboardHero";
import AppContainer from "@/components/ui/AppContainer";

export default function ArchitecturePage() {
  return (
    <AppContainer as="main" className="max-w-[1700px] py-10">
      <section className="app-card rounded-2xl p-6">
        <DashboardHero
          eyebrow="Architecture"
          title="Application Architecture Blueprint"
          description="Complete end-to-end view with layered components, data flow, and supporting platform services."
          actions={(
            <Link href="/dashboard/mutual-funds" className="app-btn app-btn-secondary border-white/30 bg-white/5 text-white hover:bg-white/10">
              Back to Mutual Funds
            </Link>
          )}
          className="mb-5"
        />

        <div className="mt-4 rounded-xl border border-black/20 p-3 text-xs text-gray-700">
          Left-to-right main flow: Channels -&gt; Frontend -&gt; API Routes -&gt; Domain Services -&gt; Data &amp; Integrations. Supporting
          controls (security, monitoring, scheduler) are mapped below.
        </div>

        <div className="mt-6 overflow-x-auto">
          <svg
            viewBox="0 0 2200 1240"
            className="min-w-[1600px]"
            role="img"
            aria-label="Complete application architecture diagram"
          >
            <defs>
              <marker id="arrow" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto">
                <path d="M0,0 L10,5 L0,10 Z" fill="#000" />
              </marker>
            </defs>

            <text x="60" y="55" fontSize="30" fontWeight="700" fill="#000">
              Stellar Trading Application - System Architecture
            </text>

            <rect x="40" y="90" width="390" height="470" rx="18" fill="#fff" stroke="#000" strokeWidth="2" />
            <text x="65" y="130" fontSize="22" fontWeight="600" fill="#000">
              Client Channels
            </text>
            <rect x="70" y="165" width="320" height="78" rx="12" fill="#fff" stroke="#000" strokeWidth="2" />
            <text x="230" y="206" textAnchor="middle" fontSize="18" fill="#000">
              Web Browser
            </text>
            <rect x="70" y="265" width="320" height="78" rx="12" fill="#fff" stroke="#000" strokeWidth="2" />
            <text x="230" y="306" textAnchor="middle" fontSize="18" fill="#000">
              Authenticated User Session
            </text>
            <rect x="70" y="365" width="320" height="78" rx="12" fill="#fff" stroke="#000" strokeWidth="2" />
            <text x="230" y="406" textAnchor="middle" fontSize="18" fill="#000">
              UPI Mandate Interaction
            </text>

            <rect x="470" y="90" width="430" height="470" rx="18" fill="#fff" stroke="#000" strokeWidth="2" />
            <text x="495" y="130" fontSize="22" fontWeight="600" fill="#000">
              Frontend (Next.js App Router)
            </text>
            <rect x="500" y="165" width="360" height="68" rx="12" fill="#fff" stroke="#000" strokeWidth="2" />
            <text x="680" y="207" textAnchor="middle" fontSize="17" fill="#000">
              Dashboard Layout + Navigation
            </text>
            <rect x="500" y="253" width="360" height="68" rx="12" fill="#fff" stroke="#000" strokeWidth="2" />
            <text x="680" y="295" textAnchor="middle" fontSize="17" fill="#000">
              Mutual Funds Page (Search, Sort, Tables)
            </text>
            <rect x="500" y="341" width="360" height="68" rx="12" fill="#fff" stroke="#000" strokeWidth="2" />
            <text x="680" y="383" textAnchor="middle" fontSize="17" fill="#000">
              SIP Calculator + UPI Modal Flow
            </text>
            <rect x="500" y="429" width="360" height="68" rx="12" fill="#fff" stroke="#000" strokeWidth="2" />
            <text x="680" y="470" textAnchor="middle" fontSize="17" fill="#000">
              Footer / Routes / Architecture Page
            </text>

            <rect x="940" y="90" width="410" height="470" rx="18" fill="#fff" stroke="#000" strokeWidth="2" />
            <text x="965" y="130" fontSize="22" fontWeight="600" fill="#000">
              API Routes
            </text>
            <rect x="970" y="165" width="350" height="62" rx="12" fill="#fff" stroke="#000" strokeWidth="2" />
            <text x="1145" y="204" textAnchor="middle" fontSize="17" fill="#000">
              /api/auth/me
            </text>
            <rect x="970" y="242" width="350" height="62" rx="12" fill="#fff" stroke="#000" strokeWidth="2" />
            <text x="1145" y="281" textAnchor="middle" fontSize="17" fill="#000">
              /api/market/mutual-funds
            </text>
            <rect x="970" y="319" width="350" height="62" rx="12" fill="#fff" stroke="#000" strokeWidth="2" />
            <text x="1145" y="358" textAnchor="middle" fontSize="17" fill="#000">
              /api/market/mutual-funds/metrics
            </text>
            <rect x="970" y="396" width="350" height="62" rx="12" fill="#fff" stroke="#000" strokeWidth="2" />
            <text x="1145" y="435" textAnchor="middle" fontSize="17" fill="#000">
              /api/user/sips (GET / POST / PATCH)
            </text>

            <rect x="1390" y="90" width="410" height="470" rx="18" fill="#fff" stroke="#000" strokeWidth="2" />
            <text x="1415" y="130" fontSize="22" fontWeight="600" fill="#000">
              Domain Services
            </text>
            <rect x="1420" y="165" width="350" height="62" rx="12" fill="#fff" stroke="#000" strokeWidth="2" />
            <text x="1595" y="203" textAnchor="middle" fontSize="17" fill="#000">
              Market Data Aggregation Service
            </text>
            <rect x="1420" y="242" width="350" height="62" rx="12" fill="#fff" stroke="#000" strokeWidth="2" />
            <text x="1595" y="280" textAnchor="middle" fontSize="17" fill="#000">
              Metrics Computation Service
            </text>
            <rect x="1420" y="319" width="350" height="62" rx="12" fill="#fff" stroke="#000" strokeWidth="2" />
            <text x="1595" y="357" textAnchor="middle" fontSize="17" fill="#000">
              SIP Orchestration + Validation
            </text>
            <rect x="1420" y="396" width="350" height="62" rx="12" fill="#fff" stroke="#000" strokeWidth="2" />
            <text x="1595" y="434" textAnchor="middle" fontSize="17" fill="#000">
              Session / Access Control Service
            </text>

            <rect x="1840" y="90" width="320" height="470" rx="18" fill="#fff" stroke="#000" strokeWidth="2" />
            <text x="1865" y="130" fontSize="22" fontWeight="600" fill="#000">
              Data & External Systems
            </text>
            <rect x="1868" y="165" width="264" height="62" rx="12" fill="#fff" stroke="#000" strokeWidth="2" />
            <text x="2000" y="203" textAnchor="middle" fontSize="17" fill="#000">
              PostgreSQL (Users / SIPs)
            </text>
            <rect x="1868" y="242" width="264" height="62" rx="12" fill="#fff" stroke="#000" strokeWidth="2" />
            <text x="2000" y="280" textAnchor="middle" fontSize="17" fill="#000">
              Redis Cache
            </text>
            <rect x="1868" y="319" width="264" height="62" rx="12" fill="#fff" stroke="#000" strokeWidth="2" />
            <text x="2000" y="357" textAnchor="middle" fontSize="17" fill="#000">
              AMFI / Market Feeds
            </text>
            <rect x="1868" y="396" width="264" height="62" rx="12" fill="#fff" stroke="#000" strokeWidth="2" />
            <text x="2000" y="434" textAnchor="middle" fontSize="17" fill="#000">
              UPI / Payment Gateway
            </text>

            <line x1="390" y1="206" x2="500" y2="206" stroke="#000" strokeWidth="2.2" markerEnd="url(#arrow)" />
            <line x1="390" y1="306" x2="500" y2="295" stroke="#000" strokeWidth="2.2" markerEnd="url(#arrow)" />
            <line x1="390" y1="406" x2="500" y2="383" stroke="#000" strokeWidth="2.2" markerEnd="url(#arrow)" />

            <line x1="860" y1="207" x2="970" y2="196" stroke="#000" strokeWidth="2.2" markerEnd="url(#arrow)" />
            <line x1="860" y1="295" x2="970" y2="273" stroke="#000" strokeWidth="2.2" markerEnd="url(#arrow)" />
            <line x1="860" y1="383" x2="970" y2="350" stroke="#000" strokeWidth="2.2" markerEnd="url(#arrow)" />
            <line x1="860" y1="470" x2="970" y2="427" stroke="#000" strokeWidth="2.2" markerEnd="url(#arrow)" />

            <line x1="1320" y1="196" x2="1420" y2="196" stroke="#000" strokeWidth="2.2" markerEnd="url(#arrow)" />
            <line x1="1320" y1="273" x2="1420" y2="273" stroke="#000" strokeWidth="2.2" markerEnd="url(#arrow)" />
            <line x1="1320" y1="350" x2="1420" y2="350" stroke="#000" strokeWidth="2.2" markerEnd="url(#arrow)" />
            <line x1="1320" y1="427" x2="1420" y2="427" stroke="#000" strokeWidth="2.2" markerEnd="url(#arrow)" />

            <line x1="1770" y1="196" x2="1868" y2="196" stroke="#000" strokeWidth="2.2" markerEnd="url(#arrow)" />
            <line x1="1770" y1="273" x2="1868" y2="273" stroke="#000" strokeWidth="2.2" markerEnd="url(#arrow)" />
            <line x1="1770" y1="350" x2="1868" y2="350" stroke="#000" strokeWidth="2.2" markerEnd="url(#arrow)" />
            <line x1="1770" y1="427" x2="1868" y2="427" stroke="#000" strokeWidth="2.2" markerEnd="url(#arrow)" />

            <rect x="40" y="610" width="2120" height="285" rx="18" fill="#fff" stroke="#000" strokeWidth="2" />
            <text x="65" y="652" fontSize="22" fontWeight="600" fill="#000">
              Platform Support Layer
            </text>

            <rect x="85" y="690" width="390" height="68" rx="12" fill="#fff" stroke="#000" strokeWidth="2" />
            <text x="280" y="731" textAnchor="middle" fontSize="17" fill="#000">
              Authentication & Role Guard
            </text>
            <rect x="505" y="690" width="390" height="68" rx="12" fill="#fff" stroke="#000" strokeWidth="2" />
            <text x="700" y="731" textAnchor="middle" fontSize="17" fill="#000">
              Input Validation & Error Handling
            </text>
            <rect x="925" y="690" width="390" height="68" rx="12" fill="#fff" stroke="#000" strokeWidth="2" />
            <text x="1120" y="731" textAnchor="middle" fontSize="17" fill="#000">
              Logging, Metrics, Alerting
            </text>
            <rect x="1345" y="690" width="390" height="68" rx="12" fill="#fff" stroke="#000" strokeWidth="2" />
            <text x="1540" y="731" textAnchor="middle" fontSize="17" fill="#000">
              Caching & Rate Limiting
            </text>
            <rect x="1765" y="690" width="350" height="68" rx="12" fill="#fff" stroke="#000" strokeWidth="2" />
            <text x="1940" y="731" textAnchor="middle" fontSize="17" fill="#000">
              Scheduler / Background Jobs
            </text>

            <rect x="40" y="930" width="2120" height="255" rx="18" fill="#fff" stroke="#000" strokeWidth="2" />
            <text x="65" y="973" fontSize="22" fontWeight="600" fill="#000">
              Key Functional Streams
            </text>
            <text x="85" y="1020" fontSize="18" fill="#000">
              1. Fund Discovery: Browser -&gt; Mutual Funds UI -&gt; market APIs -&gt; metrics service -&gt; table rendering
            </text>
            <text x="85" y="1060" fontSize="18" fill="#000">
              2. SIP Lifecycle: User setup -&gt; UPI flow -&gt; /api/user/sips -&gt; persistence -&gt; active/paused state
            </text>
            <text x="85" y="1100" fontSize="18" fill="#000">
              3. Portfolio Insight: Cached and computed returns feed dashboard cards and SIP plan performance
            </text>
            <text x="85" y="1140" fontSize="18" fill="#000">
              4. Reliability: Observability, validation, and auth checks wrap every request path
            </text>

            <line x1="1145" y1="458" x2="1145" y2="690" stroke="#000" strokeWidth="2" strokeDasharray="8 8" markerEnd="url(#arrow)" />
            <line x1="1595" y1="458" x2="1540" y2="690" stroke="#000" strokeWidth="2" strokeDasharray="8 8" markerEnd="url(#arrow)" />
            <line x1="2000" y1="458" x2="1940" y2="690" stroke="#000" strokeWidth="2" strokeDasharray="8 8" markerEnd="url(#arrow)" />
          </svg>
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-black bg-white p-6">
        <h2 className="text-xl font-semibold text-black">Use Case Diagram</h2>
        <p className="mt-1 text-sm text-gray-700">
          Primary actors and interactions with authentication, fund exploration, SIP setup, and portfolio tracking.
        </p>
        <div className="mt-5 overflow-x-auto">
          <svg viewBox="0 0 1800 760" className="min-w-[1300px]" role="img" aria-label="Use case diagram for application">
            <defs>
              <marker id="ucArrow" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto">
                <path d="M0,0 L10,5 L0,10 Z" fill="#000" />
              </marker>
            </defs>

            <rect x="380" y="40" width="1220" height="660" rx="16" fill="#fff" stroke="#000" strokeWidth="2" />
            <text x="410" y="76" fontSize="24" fontWeight="600" fill="#000">
              Stellar Trading Platform
            </text>

            <circle cx="140" cy="210" r="34" fill="#fff" stroke="#000" strokeWidth="2" />
            <line x1="140" y1="244" x2="140" y2="320" stroke="#000" strokeWidth="2" />
            <line x1="105" y1="275" x2="175" y2="275" stroke="#000" strokeWidth="2" />
            <line x1="140" y1="320" x2="108" y2="370" stroke="#000" strokeWidth="2" />
            <line x1="140" y1="320" x2="172" y2="370" stroke="#000" strokeWidth="2" />
            <text x="140" y="400" textAnchor="middle" fontSize="18" fill="#000">
              Investor
            </text>

            <circle cx="140" cy="510" r="34" fill="#fff" stroke="#000" strokeWidth="2" />
            <line x1="140" y1="544" x2="140" y2="620" stroke="#000" strokeWidth="2" />
            <line x1="105" y1="575" x2="175" y2="575" stroke="#000" strokeWidth="2" />
            <line x1="140" y1="620" x2="108" y2="670" stroke="#000" strokeWidth="2" />
            <line x1="140" y1="620" x2="172" y2="670" stroke="#000" strokeWidth="2" />
            <text x="140" y="705" textAnchor="middle" fontSize="18" fill="#000">
              Admin / Ops
            </text>

            <ellipse cx="650" cy="170" rx="190" ry="44" fill="#fff" stroke="#000" strokeWidth="2" />
            <text x="650" y="176" textAnchor="middle" fontSize="17" fill="#000">
              Login and Session Validation
            </text>

            <ellipse cx="650" cy="290" rx="190" ry="44" fill="#fff" stroke="#000" strokeWidth="2" />
            <text x="650" y="296" textAnchor="middle" fontSize="17" fill="#000">
              Search and Filter Mutual Funds
            </text>

            <ellipse cx="650" cy="410" rx="190" ry="44" fill="#fff" stroke="#000" strokeWidth="2" />
            <text x="650" y="416" textAnchor="middle" fontSize="17" fill="#000">
              View NAV and Returns Metrics
            </text>

            <ellipse cx="650" cy="530" rx="190" ry="44" fill="#fff" stroke="#000" strokeWidth="2" />
            <text x="650" y="536" textAnchor="middle" fontSize="17" fill="#000">
              Start SIP with UPI Approval
            </text>

            <ellipse cx="1040" cy="230" rx="210" ry="44" fill="#fff" stroke="#000" strokeWidth="2" />
            <text x="1040" y="236" textAnchor="middle" fontSize="17" fill="#000">
              Create, Pause, Resume SIP Plans
            </text>

            <ellipse cx="1040" cy="370" rx="210" ry="44" fill="#fff" stroke="#000" strokeWidth="2" />
            <text x="1040" y="376" textAnchor="middle" fontSize="17" fill="#000">
              Track Portfolio and SIP Status
            </text>

            <ellipse cx="1040" cy="510" rx="210" ry="44" fill="#fff" stroke="#000" strokeWidth="2" />
            <text x="1040" y="516" textAnchor="middle" fontSize="17" fill="#000">
              Monitor Logs and Platform Health
            </text>

            <ellipse cx="1420" cy="300" rx="150" ry="42" fill="#fff" stroke="#000" strokeWidth="2" />
            <text x="1420" y="306" textAnchor="middle" fontSize="16" fill="#000">
              Fetch Market Feed
            </text>

            <ellipse cx="1420" cy="470" rx="150" ry="42" fill="#fff" stroke="#000" strokeWidth="2" />
            <text x="1420" y="476" textAnchor="middle" fontSize="16" fill="#000">
              Persist SIP Records
            </text>

            <line x1="174" y1="260" x2="460" y2="170" stroke="#000" strokeWidth="2" markerEnd="url(#ucArrow)" />
            <line x1="174" y1="285" x2="460" y2="290" stroke="#000" strokeWidth="2" markerEnd="url(#ucArrow)" />
            <line x1="174" y1="305" x2="460" y2="410" stroke="#000" strokeWidth="2" markerEnd="url(#ucArrow)" />
            <line x1="174" y1="330" x2="460" y2="530" stroke="#000" strokeWidth="2" markerEnd="url(#ucArrow)" />

            <line x1="174" y1="575" x2="830" y2="510" stroke="#000" strokeWidth="2" markerEnd="url(#ucArrow)" />
            <line x1="174" y1="595" x2="830" y2="370" stroke="#000" strokeWidth="2" markerEnd="url(#ucArrow)" />

            <line x1="840" y1="530" x2="830" y2="230" stroke="#000" strokeWidth="2" markerEnd="url(#ucArrow)" />
            <line x1="1245" y1="230" x2="1270" y2="300" stroke="#000" strokeWidth="2" markerEnd="url(#ucArrow)" />
            <line x1="1235" y1="370" x2="1270" y2="470" stroke="#000" strokeWidth="2" markerEnd="url(#ucArrow)" />
          </svg>
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-black bg-white p-6">
        <h2 className="text-xl font-semibold text-black">API Catalog</h2>
        <p className="mt-1 text-sm text-gray-700">Core application endpoints grouped by functional area.</p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[980px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-black">
                <th className="px-3 py-3 font-semibold text-black">Method</th>
                <th className="px-3 py-3 font-semibold text-black">Endpoint</th>
                <th className="px-3 py-3 font-semibold text-black">Purpose</th>
                <th className="px-3 py-3 font-semibold text-black">Key Response Data</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-black/20">
                <td className="px-3 py-3">GET</td>
                <td className="px-3 py-3 font-mono">/api/auth/me</td>
                <td className="px-3 py-3">Validate active user session</td>
                <td className="px-3 py-3">user id, session state</td>
              </tr>
              <tr className="border-b border-black/20">
                <td className="px-3 py-3">GET</td>
                <td className="px-3 py-3 font-mono">/api/market/mutual-funds?limit=&amp;q=</td>
                <td className="px-3 py-3">Search and list mutual fund schemes</td>
                <td className="px-3 py-3">code, schemeName</td>
              </tr>
              <tr className="border-b border-black/20">
                <td className="px-3 py-3">GET</td>
                <td className="px-3 py-3 font-mono">/api/market/mutual-funds/metrics?codes=</td>
                <td className="px-3 py-3">Fetch NAV and return metrics for schemes</td>
                <td className="px-3 py-3">latestNav, navDate, return1Y, return3Y</td>
              </tr>
              <tr className="border-b border-black/20">
                <td className="px-3 py-3">GET</td>
                <td className="px-3 py-3 font-mono">/api/user/sips</td>
                <td className="px-3 py-3">List SIP plans for logged-in user</td>
                <td className="px-3 py-3">id, fundCode, monthlyAmount, status</td>
              </tr>
              <tr className="border-b border-black/20">
                <td className="px-3 py-3">POST</td>
                <td className="px-3 py-3 font-mono">/api/user/sips</td>
                <td className="px-3 py-3">Create new SIP plan after UPI confirmation</td>
                <td className="px-3 py-3">created sip plan object</td>
              </tr>
              <tr>
                <td className="px-3 py-3">PATCH</td>
                <td className="px-3 py-3 font-mono">/api/user/sips</td>
                <td className="px-3 py-3">Update SIP status (ACTIVE/PAUSED)</td>
                <td className="px-3 py-3">updated status and metadata</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-black bg-white p-6">
        <h2 className="text-xl font-semibold text-black">Database Schema Overview</h2>
        <p className="mt-1 text-sm text-gray-700">
          Logical schema reference for users, SIPs, orders, portfolio, and trade lifecycle data.
        </p>
        <div className="mt-5 grid gap-4 lg:grid-cols-3">
          <article className="rounded-xl border border-black p-4">
            <h3 className="text-base font-semibold text-black">users</h3>
            <p className="mt-1 text-xs text-gray-600">Application accounts and identity data.</p>
            <ul className="mt-3 space-y-1 text-sm text-black">
              <li>id (PK, uuid)</li>
              <li>email (unique)</li>
              <li>name</li>
              <li>password_hash</li>
              <li>role</li>
              <li>created_at</li>
              <li>updated_at</li>
            </ul>
          </article>

          <article className="rounded-xl border border-black p-4">
            <h3 className="text-base font-semibold text-black">sip_plans</h3>
            <p className="mt-1 text-xs text-gray-600">Recurring investment plans per user and fund.</p>
            <ul className="mt-3 space-y-1 text-sm text-black">
              <li>id (PK, uuid)</li>
              <li>user_id (FK -&gt; users.id)</li>
              <li>fund_code</li>
              <li>fund_name</li>
              <li>monthly_amount</li>
              <li>expected_annual_return</li>
              <li>day_of_month</li>
              <li>start_date</li>
              <li>status (ACTIVE | PAUSED)</li>
              <li>created_at / updated_at</li>
            </ul>
          </article>

          <article className="rounded-xl border border-black p-4">
            <h3 className="text-base font-semibold text-black">sip_transactions</h3>
            <p className="mt-1 text-xs text-gray-600">Payment and execution trail for SIP cycles.</p>
            <ul className="mt-3 space-y-1 text-sm text-black">
              <li>id (PK, uuid)</li>
              <li>sip_plan_id (FK -&gt; sip_plans.id)</li>
              <li>txn_ref</li>
              <li>amount</li>
              <li>gateway_provider</li>
              <li>payment_status</li>
              <li>executed_at</li>
              <li>created_at</li>
            </ul>
          </article>

          <article className="rounded-xl border border-black p-4">
            <h3 className="text-base font-semibold text-black">orderbook</h3>
            <p className="mt-1 text-xs text-gray-600">Placed orders with execution lifecycle and status.</p>
            <ul className="mt-3 space-y-1 text-sm text-black">
              <li>id (PK, uuid)</li>
              <li>user_id (FK -&gt; users.id)</li>
              <li>symbol</li>
              <li>order_type (MARKET | LIMIT)</li>
              <li>side (BUY | SELL)</li>
              <li>quantity</li>
              <li>limit_price</li>
              <li>status (OPEN | FILLED | CANCELLED)</li>
              <li>placed_at</li>
              <li>updated_at</li>
            </ul>
          </article>

          <article className="rounded-xl border border-black p-4">
            <h3 className="text-base font-semibold text-black">portfolio</h3>
            <p className="mt-1 text-xs text-gray-600">Current holdings snapshot aggregated per symbol.</p>
            <ul className="mt-3 space-y-1 text-sm text-black">
              <li>id (PK, uuid)</li>
              <li>user_id (FK -&gt; users.id)</li>
              <li>symbol</li>
              <li>holding_qty</li>
              <li>avg_buy_price</li>
              <li>invested_value</li>
              <li>current_value</li>
              <li>unrealized_pnl</li>
              <li>as_of_date</li>
              <li>updated_at</li>
            </ul>
          </article>

          <article className="rounded-xl border border-black p-4">
            <h3 className="text-base font-semibold text-black">trades</h3>
            <p className="mt-1 text-xs text-gray-600">Executed trade records generated from filled orders.</p>
            <ul className="mt-3 space-y-1 text-sm text-black">
              <li>id (PK, uuid)</li>
              <li>order_id (FK -&gt; orderbook.id)</li>
              <li>user_id (FK -&gt; users.id)</li>
              <li>symbol</li>
              <li>side (BUY | SELL)</li>
              <li>executed_qty</li>
              <li>executed_price</li>
              <li>executed_at</li>
              <li>brokerage_charges</li>
              <li>net_amount</li>
            </ul>
          </article>
        </div>

        <div className="mt-5 rounded-xl border border-black/20 p-4 text-sm text-gray-700">
          Relationships: <span className="font-medium text-black">users 1:N sip_plans</span> and{" "}
          <span className="font-medium text-black">sip_plans 1:N sip_transactions</span>,{" "}
          <span className="font-medium text-black">users 1:N orderbook</span>,{" "}
          <span className="font-medium text-black">orderbook 1:N trades</span>, and{" "}
          <span className="font-medium text-black">users 1:N portfolio</span>.
        </div>

        <div className="mt-5 rounded-xl border border-black p-4">
          <h3 className="text-base font-semibold text-black">Sources of Data</h3>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[860px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-black">
                  <th className="px-3 py-2 font-semibold text-black">Data Domain</th>
                  <th className="px-3 py-2 font-semibold text-black">Primary Source</th>
                  <th className="px-3 py-2 font-semibold text-black">Ingestion Path</th>
                  <th className="px-3 py-2 font-semibold text-black">Storage Layer</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-black/20">
                  <td className="px-3 py-2">Mutual Fund Schemes</td>
                  <td className="px-3 py-2">AMFI / market feed provider</td>
                  <td className="px-3 py-2">/api/market/mutual-funds</td>
                  <td className="px-3 py-2">Cached + derived response</td>
                </tr>
                <tr className="border-b border-black/20">
                  <td className="px-3 py-2">NAV and Returns Metrics</td>
                  <td className="px-3 py-2">Market history endpoints</td>
                  <td className="px-3 py-2">/api/market/mutual-funds/metrics</td>
                  <td className="px-3 py-2">Redis + computation layer</td>
                </tr>
                <tr className="border-b border-black/20">
                  <td className="px-3 py-2">SIP Plans and Transactions</td>
                  <td className="px-3 py-2">User actions + UPI workflow</td>
                  <td className="px-3 py-2">/api/user/sips</td>
                  <td className="px-3 py-2">PostgreSQL (sip_plans, sip_transactions)</td>
                </tr>
                <tr className="border-b border-black/20">
                  <td className="px-3 py-2">Orderbook and Trades</td>
                  <td className="px-3 py-2">Trade terminal order events</td>
                  <td className="px-3 py-2">Order/trade APIs and execution service</td>
                  <td className="px-3 py-2">PostgreSQL (orderbook, trades)</td>
                </tr>
                <tr>
                  <td className="px-3 py-2">Portfolio Positions</td>
                  <td className="px-3 py-2">Computed from trades + live prices</td>
                  <td className="px-3 py-2">Portfolio aggregation service</td>
                  <td className="px-3 py-2">PostgreSQL (portfolio)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </AppContainer>
  );
}
