import { useMemo } from "react";
import type { TransactionRecord } from "../types";

interface Props {
  transactions: TransactionRecord[];
}

const EVENT_META: Record<string, { icon: string; color: string; border: string }> = {
  COMPLETED: { icon: "✓", color: "text-emerald-400", border: "border-emerald-500/40" },
  APPROVED: { icon: "✓", color: "text-emerald-400", border: "border-emerald-500/40" },
  HELD: { icon: "⏸", color: "text-amber-400", border: "border-amber-500/40" },
  BLOCKED: { icon: "🚫", color: "text-rose-400", border: "border-rose-500/40" },
  REJECTED: { icon: "✕", color: "text-rose-400", border: "border-rose-500/40" },
  TIMEOUT: { icon: "⏱", color: "text-slate-400", border: "border-slate-500/40" },
};

export function ActivityFeed({ transactions }: Props) {
  const recent = useMemo(() => transactions.slice(0, 10), [transactions]);

  if (recent.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-500 text-xs py-12">
        <span className="text-2xl mb-2">📡</span>
        <span>Awaiting agent tool calls...</span>
      </div>
    );
  }

  return (
    <div className="space-y-2.5 overflow-y-auto max-h-[500px] pr-1">
      {recent.map((tx) => {
        const meta = EVENT_META[tx.status] ?? EVENT_META.COMPLETED;
        return (
          <div
            key={tx.id}
            className={`p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition-all flex items-start gap-3 relative overflow-hidden group`}
          >
            <div className={`w-1 h-full absolute left-0 top-0 ${meta.border.replace('border', 'bg')}`} />
            
            <div className="flex-1 min-w-0 pl-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-mono font-semibold text-slate-200 truncate">
                  {tx.merchant}
                </span>
                <span className="text-xs font-mono font-bold text-slate-100 shrink-0">
                  ${tx.amount.toFixed(2)}
                </span>
              </div>

              <div className="flex items-center gap-2 mt-1">
                <span className={`text-xs ${meta.color}`}>{meta.icon}</span>
                <span className="text-[11px] font-mono text-slate-400 truncate">
                  {tx.status}
                </span>
                <span className="text-[10px] font-mono text-slate-600 ml-auto">
                  {new Date(tx.timestamp).toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  })}
                </span>
              </div>

              {tx.policyResult.triggeredRules.length > 0 && (
                <div className="mt-1.5 pt-1.5 border-t border-slate-800/50">
                  <p className="text-[10px] font-mono text-rose-400 truncate">
                    → {tx.policyResult.triggeredRules[0]}
                  </p>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
