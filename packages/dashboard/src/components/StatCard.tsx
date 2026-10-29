interface StatCardProps {
  label: string;
  value: string | number;
  icon: string;
  color: string;
  glowColor: string;
  subtext?: string;
}

export function StatCard({
  label,
  value,
  icon,
  color,
  glowColor,
  subtext,
}: StatCardProps) {
  return (
    <div className="glass-card glass-card-hover rounded-2xl p-4 flex flex-col justify-between relative overflow-hidden group">
      {/* Background Ambient Glow Accent */}
      <div
        className="absolute -right-4 -top-4 w-20 h-20 rounded-full blur-2xl transition-all duration-500 group-hover:scale-150 opacity-60"
        style={{ backgroundColor: glowColor }}
      />

      <div className="flex items-center justify-between relative z-10">
        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider font-mono">
          {label}
        </span>
        <div className="w-8 h-8 rounded-lg bg-slate-800/80 border border-slate-700/50 flex items-center justify-center text-sm shadow-inner">
          {icon}
        </div>
      </div>

      <div className="mt-3 relative z-10">
        <div className={`text-2xl lg:text-3xl font-bold font-mono tracking-tight ${color}`}>
          {value}
        </div>
        {subtext && (
          <p className="text-[11px] text-slate-500 mt-1 font-sans truncate">
            {subtext}
          </p>
        )}
      </div>
    </div>
  );
}
