import React, { useState } from "react";
import { Shield, Play, Loader2, Sparkles } from "lucide-react";

interface HeaderProps {
  isConnected: boolean;
  onDemoRun?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ isConnected, onDemoRun }) => {
  const [isRunningDemo, setIsRunningDemo] = useState(false);

  const handleRunDemo = async () => {
    setIsRunningDemo(true);
    try {
      const res = await fetch("/v1/demo/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (res.ok) {
        onDemoRun?.();
      }
    } catch (err) {
      console.error("Failed to trigger demo:", err);
    } finally {
      setTimeout(() => setIsRunningDemo(false), 6000);
    }
  };

  return (
    <header className="bg-gray-900/90 border-b border-gray-800 px-6 py-3.5 flex items-center justify-between backdrop-blur-md sticky top-0 z-50">
      <div className="flex items-center gap-3">
        <div className="relative p-2.5 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl shadow-[0_0_20px_rgba(37,99,235,0.4)] border border-blue-400/30">
          <Shield className="w-5 h-5 text-white" />
          <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-gray-900 animate-ping" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
              PayGuard
              <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-full">
                MCP Gateway
              </span>
            </h1>
          </div>
          <p className="text-xs text-gray-400">
            Agentic Spending Firewall for PayPal • Real-Time Policy Enforcement
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Live WebSocket Status Pill */}
        <div
          className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border ${
            isConnected
              ? "bg-emerald-950/40 text-emerald-400 border-emerald-800/60"
              : "bg-rose-950/40 text-rose-400 border-rose-800/60"
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              isConnected
                ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse"
                : "bg-rose-500"
            }`}
          />
          {isConnected ? "Gateway Online (ws://)" : "Reconnecting Gateway..."}
        </div>

        {/* Sponsor Badges */}
        <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 bg-gray-800/60 border border-gray-700/60 rounded-lg text-[11px] font-mono text-gray-300">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>AG Grid • PayPal Sandbox</span>
        </div>

        {/* 1-Click Demo Mode Button */}
        <button
          onClick={handleRunDemo}
          disabled={isRunningDemo || !isConnected}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all duration-200 border shadow-md ${
            isRunningDemo
              ? "bg-indigo-900/60 text-indigo-300 border-indigo-700/50 cursor-not-allowed"
              : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white border-blue-400/30 hover:shadow-blue-500/20"
          }`}
          title="Simulate 3-Act Demo (Grocery ALLOW → Sub HOLD → Phishing BLOCK)"
        >
          {isRunningDemo ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Simulating Demo...</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Run 3-Act Demo</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
};

