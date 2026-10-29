import React from "react";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  variant?: "blue" | "emerald" | "amber" | "rose";
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = "blue",
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case "emerald":
        return {
          iconBg: "bg-emerald-950/50 text-emerald-400 border-emerald-800/40",
          glow: "group-hover:border-emerald-500/30",
        };
      case "amber":
        return {
          iconBg: "bg-amber-950/50 text-amber-400 border-amber-800/40",
          glow: "group-hover:border-amber-500/30",
        };
      case "rose":
        return {
          iconBg: "bg-rose-950/50 text-rose-400 border-rose-800/40",
          glow: "group-hover:border-rose-500/30",
        };
      default:
        return {
          iconBg: "bg-blue-950/50 text-blue-400 border-blue-800/40",
          glow: "group-hover:border-blue-500/30",
        };
    }
  };

  const { iconBg, glow } = getVariantStyles();

  return (
    <div
      className={`group relative bg-gray-900/80 backdrop-blur-sm border border-gray-800/80 rounded-xl p-4 transition-all duration-300 hover:shadow-lg ${glow}`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
          {title}
        </span>
        <div className={`p-2 rounded-lg border ${iconBg}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-bold font-mono tracking-tight text-white">
          {value}
        </span>
      </div>
      {subtitle && (
        <p className="mt-1 text-xs text-gray-400 flex items-center gap-1">
          {subtitle}
        </p>
      )}
    </div>
  );
};

