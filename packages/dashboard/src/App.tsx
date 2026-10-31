import { Header } from "./components/Header";
import { StatCard } from "./components/StatCard";
import { TransactionGrid } from "./components/TransactionGrid";
import { ActivityFeed } from "./components/ActivityFeed";
import { useWebSocket } from "./hooks/useWebSocket";
import { useStats } from "./hooks/useStats";

export default function App() {
  const { transactions, connected, eventCount, resetDemoState } = useWebSocket();
  const stats = useStats(transactions);

  return (
    <div className="min-h-screen flex flex-col bg-[#060913] text-slate-100 ambient-glow selection:bg-blue-500/30">
      <Header connected={connected} eventCount={eventCount} onReset={resetDemoState} />

      <main className="flex-1 flex flex-col p-4 md:p-6 space-y-5 max-w-[1700px] w-full mx-auto min-h-0">
        {/* Metric Cards Row */}
        <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
          <StatCard
            label="Intercepted"
            value={stats.total}
            icon="🛡️"
            color="text-indigo-400"
            glowColor="rgba(99, 102, 241, 0.15)"
            subtext="Autonomous requests"
          />
          <StatCard
            label="Total Volume"
            value={`$${stats.totalVolume.toFixed(2)}`}
            icon="💰"
            color="text-emerald-400"
            glowColor="rgba(16, 185, 129, 0.15)"
            subtext="Guarded volume sum"
          />
          <StatCard
            label="Active Holds"
            value={stats.held}
            icon="⏸️"
            color="text-amber-400"
            glowColor="rgba(245, 158, 11, 0.15)"
            subtext="HITL mobile pending"
          />
          <StatCard
            label="High-Risk Blocked"
            value={stats.blocked}
            icon="🚫"
            color="text-rose-400"
            glowColor="rgba(244, 63, 94, 0.15)"
            subtext="Phishing & threat halted"
          />
          <StatCard
            label="Approved"
            value={stats.completed}
            icon="✅"
            color="text-emerald-400"
            glowColor="rgba(16, 185, 129, 0.15)"
            subtext="Passed security check"
          />
          <StatCard
            label="Avg Risk Score"
            value={`${stats.avgRisk}/100`}
            icon="🎯"
            color={
              stats.avgRisk >= 70
                ? "text-rose-400"
                : stats.avgRisk >= 30
                  ? "text-amber-400"
                  : "text-emerald-400"
            }
            glowColor={
              stats.avgRisk >= 70
                ? "rgba(244, 63, 94, 0.15)"
                : "rgba(16, 185, 129, 0.15)"
            }
            subtext="Gateway threat index"
          />
        </section>

        {/* Main Content Workspace */}
        <section className="flex-1 flex flex-col lg:flex-row gap-5 min-h-[580px]">
          {/* Main AG Grid Container */}
          <div className="flex-1 glass-card rounded-2xl overflow-hidden flex flex-col border border-slate-800/80">
            <div className="px-5 py-4 border-b border-slate-800/80 flex items-center justify-between bg-slate-900/40">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
                <h2 className="text-sm font-semibold text-slate-200 tracking-wide uppercase">
                  Transaction Audit Stream
                </h2>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  AG Grid v33 Quartz
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="text-xs text-slate-400 font-mono">
                  Live Stream Active
                </span>
              </div>
            </div>

            <div className="flex-1 min-h-[460px] relative">
              <TransactionGrid transactions={transactions} />
            </div>
          </div>

          {/* Activity Feed Sidebar */}
          <aside className="w-full lg:w-96 glass-card rounded-2xl overflow-hidden flex flex-col border border-slate-800/80 shrink-0">
            <div className="px-5 py-4 border-b border-slate-800/80 flex items-center justify-between bg-slate-900/40">
              <h2 className="text-sm font-semibold text-slate-200 tracking-wide uppercase">
                Live Gateway Activity
              </h2>
              <span className="text-xs text-slate-400 font-mono">
                {eventCount} events
              </span>
            </div>
            <div className="flex-1 p-3 overflow-hidden">
              <ActivityFeed transactions={transactions} />
            </div>
          </aside>
        </section>
      </main>

      {/* Footer Bar */}
      <footer className="px-6 py-3 border-t border-slate-800/60 bg-slate-950/80 backdrop-blur-md flex flex-wrap items-center justify-between text-xs text-slate-500 font-mono">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-slate-400">
            <span className="text-blue-400">🛡️</span> AP2 Mandate Guard
          </span>
          <span>•</span>
          <span>Rules: Velocity (3/10m) | Threshold ($50) | Trust Score (&lt;70)</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-emerald-400">⚡ 100% Compromised Transactions Halted</span>
          <span>•</span>
          <span>PayGuard v0.1.0</span>
        </div>
      </footer>
    </div>
  );
}
