import React from "react";

interface RiskGaugeProps {
  score: number;
  showBar?: boolean;
}

export const RiskGauge: React.FC<RiskGaugeProps> = ({ score, showBar = true }) => {
  const getColor = () => {
    if (score >= 70) return "text-rose-400";
    if (score >= 30) return "text-amber-400";
    return "text-emerald-400";
  };

  const getBarColor = () => {
    if (score >= 70) return "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]";
    if (score >= 30) return "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]";
    return "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]";
  };

  return (
    <div className="flex items-center gap-2">
      <span className={`font-mono font-bold text-sm ${getColor()}`}>
        {score}
        <span className="text-[10px] text-gray-500 font-normal">/100</span>
      </span>
      {showBar && (
        <div className="w-14 h-1.5 bg-gray-800 rounded-full overflow-hidden border border-gray-700/50">
          <div
            className={`h-full rounded-full transition-all duration-500 ${getBarColor()}`}
            style={{ width: `${Math.min(score, 100)}%` }}
          />
        </div>
      )}
    </div>
  );
};

