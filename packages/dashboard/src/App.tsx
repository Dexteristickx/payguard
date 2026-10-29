import { useState } from "react";
import { Header } from "./components/Header";
import { StatCard } from "./components/StatCard";
import { TransactionGrid } from "./components/TransactionGrid";
import { ActivityFeed } from "./components/ActivityFeed";
import { useWebSocket } from "./hooks/useWebSocket";
import { useStats } from "./hooks/useStats";
import {
  ShieldCheck,
  ShieldAlert,
  Clock,
  DollarSign,
  TrendingUp,
} from "lucide-react";

export function App() {
  const { transactions, events, isConnected, resolveApproval, refetch } =
    useWebSocket();
  const stats = useStats(transactions);
  const [selectedTxId, setSelectedTxId] = useState<string | undefined>();

  return (
    <div className="flex flex-col h-screen w-screen bg-[#0B0F17] text-gray-100 overflow-hidden">
      {/* 1. Header */}
      <Header isConnected={isConnected} onDemoRun={refetch} />

      {/* 2. Main Content Body */}
      <main className="flex-1 flex flex-col min-h-0 p-5 gap-4 overflow-hidden">
        {/* Stat Cards Row */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-3.5 flex-shrink-0">
          <StatCard
            title="Transactions Intercepted"
            value={stats.totalCount}
            subtitle="Autonomous agent requests"
            icon={ShieldCheck}
            variant="blue"
          />
          <StatCard
            title="Total Volume"
            value={`$${stats.totalVolume.toFixed(2)}`}
            subtitle="Intercepted transaction sum"
            icon={DollarSign}
            variant="emerald"
          />
          <StatCard
            title="Active Holds (HITL)"
            value={stats.heldCount}
            subtitle="Awaiting human approval"
            icon={Clock}
            variant="amber"
          />
          <StatCard
            title="High-Risk Blocked"
            value={stats.blockedCount}
            subtitle={`Avg risk score: ${stats.avgRiskScore}/100`}
            icon={ShieldAlert}
            variant="rose"
          />
        </section>

        {/* Workspace: AG Grid Table (Main) + Activity Feed (Side) */}
        {/* CRITICAL: min-h-0 ensures AG Grid correctly constrains height and scrolls */}
        <div className="flex-1 flex min-h-0 gap-4 overflow-hidden">
          {/* Main AG Grid Container */}
          <div className="flex-1 flex flex-col min-h-0 min-w-0">
            <div className="flex items-center justify-between mb-2 flex-shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-300">
                  Transaction Audit Stream
                </span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-gray-800 text-gray-400 border border-gray-700">
                  AG Grid Community v33
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-400"></span>
                <span>Real-Time Updates Active</span>
              </div>
            </div>

            <div className="flex-1 min-h-0">
              <TransactionGrid
                transactions={transactions}
                onResolveApproval={resolveApproval}
                selectedId={selectedTxId}
              />
            </div>
          </div>

          {/* Side Activity Feed */}
          <aside className="w-80 flex-shrink-0 flex flex-col min-h-0 hidden lg:flex">
            <ActivityFeed events={events} onSelectTx={setSelectedTxId} />
          </aside>
        </div>
      </main>

      {/* 3. Sub-footer Status Bar */}
      <footer className="h-7 bg-gray-950 border-t border-gray-800/80 px-4 flex items-center justify-between text-[11px] font-mono text-gray-400 flex-shrink-0">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
            AP2 Agent Payments Protocol Guard
          </span>
          <span className="hidden md:inline">
            Rules: Velocity (3/10m) • Threshold ($50) • Trust Score (&lt;70)
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-gray-400 flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-emerald-400" />
            Zero Compromised Transactions
          </span>
          <span className="text-gray-400">|</span>
          <span className="text-gray-400">PayGuard v0.1.0</span>
        </div>
      </footer>
    </div>
  );
}

export default App;

