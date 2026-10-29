import React from "react";
import type { TransactionStatus } from "../types";

interface StatusBadgeProps {
  status: TransactionStatus;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const getBadgeStyle = () => {
    switch (status) {
      case "COMPLETED":
      case "APPROVED":
        return "bg-emerald-950/70 text-emerald-400 border-emerald-800/60 ring-1 ring-emerald-500/20";
      case "HELD":
        return "bg-amber-950/70 text-amber-400 border-amber-800/60 ring-1 ring-amber-500/20 animate-pulse";
      case "BLOCKED":
      case "REJECTED":
        return "bg-rose-950/70 text-rose-400 border-rose-800/60 ring-1 ring-rose-500/20";
      case "TIMEOUT":
        return "bg-slate-900 text-slate-400 border-slate-700";
      default:
        return "bg-slate-900 text-slate-400 border-slate-700";
    }
  };

  const getDotStyle = () => {
    switch (status) {
      case "COMPLETED":
      case "APPROVED":
        return "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]";
      case "HELD":
        return "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]";
      case "BLOCKED":
      case "REJECTED":
        return "bg-rose-400 shadow-[0_0_8px_rgba(251,113,133,0.8)]";
      default:
        return "bg-slate-400";
    }
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider border ${getBadgeStyle()}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${getDotStyle()}`} />
      {status}
    </span>
  );
};

