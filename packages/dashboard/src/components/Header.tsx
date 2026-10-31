import { useState } from "react";

interface Props {
  connected: boolean;
  eventCount: number;
  onReset?: () => void;
}

export function Header({ connected, onReset }: Props) {
  const [demoRunning, setDemoRunning] = useState(false);

  const handleRunDemo = async () => {
    setDemoRunning(true);
    try {
      await fetch("/v1/demo/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenario: "all" }),
      });
    } catch (err) {
      console.error("Demo failed:", err);
    } finally {
      setTimeout(() => setDemoRunning(false), 3000);
    }
  };

  return (
    <header className="sticky top-0 z-50 px-6 py-3.5 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl flex items-center justify-between shadow-2xl">
      {/* Brand & Identity */}
      <div className="flex items-center gap-4">
        <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 p-0.5 shadow-lg shadow-blue-500/20">
          <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center text-lg">
            🛡️
          </div>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-white font-sans">
              PayGuard
            </h1>
            <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-semibold">
              MCP Gateway
            </span>
          </div>
          <p className="text-xs text-slate-400 font-normal -mt-0.5">
            Agentic Spending Firewall for PayPal • Real-Time Policy Enforcement
          </p>
        </div>
      </div>

      {/* Status Indicators & Action CTA */}
      <div className="flex items-center gap-4">
        {/* Status Pill */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/80 border border-slate-800 text-xs text-slate-300 font-mono">
          <span
            className={`w-2 h-2 rounded-full ${
              connected
                ? "bg-emerald-400 animate-pulse-glow"
                : "bg-rose-500"
            }`}
          />
          <span>{connected ? "Gateway Online (ws://)" : "Offline"}</span>
        </div>

        {/* Sponsor Badges */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/50 border border-slate-800/80 text-xs text-slate-400 font-mono">
          <span className="text-amber-400">✨ AG Grid</span>
          <span>•</span>
          <span className="text-blue-400">PayPal Sandbox</span>
        </div>

        {/* Reset Ledger Button */}
        {onReset && (
          <button
            onClick={onReset}
            disabled={demoRunning}
            title="Clear transaction ledger & reset velocity counters"
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-300 bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            <span>↺</span>
            <span className="hidden sm:inline">Reset</span>
          </button>
        )}

        {/* Hero Demo Trigger Button */}
        <button
          onClick={handleRunDemo}
          disabled={demoRunning}
          className="relative inline-flex items-center justify-center gap-2 px-5 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 hover:from-blue-500 hover:to-indigo-500 transition-all duration-200 shadow-lg shadow-blue-600/30 hover:shadow-blue-500/50 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {demoRunning ? (
            <>
              <svg className="animate-spin h-3.5 w-3.5 text-white" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span>Executing 3-Act Demo...</span>
            </>
          ) : (
            <>
              <span className="text-sm">▶</span>
              <span>Run 3-Act Demo</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
}
