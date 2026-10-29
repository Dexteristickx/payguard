import type { TransactionStatus } from "../types";

const STATUS_STYLES: Record<TransactionStatus, string> = {
  COMPLETED: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  APPROVED: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  HELD: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  BLOCKED: "bg-rose-500/15 text-rose-300 border-rose-500/30",
  REJECTED: "bg-rose-500/15 text-rose-300 border-rose-500/30",
  TIMEOUT: "bg-slate-500/15 text-slate-300 border-slate-500/30",
};

const STATUS_ICONS: Record<TransactionStatus, string> = {
  COMPLETED: "✓",
  APPROVED: "✓",
  HELD: "⏸",
  BLOCKED: "🚫",
  REJECTED: "✕",
  TIMEOUT: "⏱",
};

export function StatusBadge({ status }: { status: TransactionStatus }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold border ${STATUS_STYLES[status]}`}
    >
      <span>{STATUS_ICONS[status]}</span>
      <span>{status}</span>
    </span>
  );
}
