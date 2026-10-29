export function RiskGauge({ score }: { score: number }) {
  const color =
    score >= 70
      ? "text-rose-400"
      : score >= 30
        ? "text-amber-400"
        : "text-emerald-400";

  const bgColor =
    score >= 70
      ? "bg-rose-500"
      : score >= 30
        ? "bg-amber-500"
        : "bg-emerald-500";

  return (
    <div className="flex items-center gap-2">
      <div className="w-14 h-1.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700/50">
        <div
          className={`h-full rounded-full transition-all duration-500 ${bgColor}`}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className={`text-xs font-mono font-bold ${color}`}>
        {score}
        <span className="text-[9px] text-slate-500 font-normal">/100</span>
      </span>
    </div>
  );
}
