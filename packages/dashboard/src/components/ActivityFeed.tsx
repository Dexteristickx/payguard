import React from "react";
import type { DashboardEvent } from "../types";
import { AlertTriangle, CheckCircle2, Clock, ShieldAlert, ArrowRight } from "lucide-react";

interface ActivityFeedProps {
  events: DashboardEvent[];
  onSelectTx?: (id: string) => void;
}

export const ActivityFeed: React.FC<ActivityFeedProps> = ({ events, onSelectTx }) => {
  const formatTime = (ts: number) => {
    return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  };

  const getEventIcon = (type: DashboardEvent["type"]) => {
    switch (type) {
      case "APPROVAL_REQUESTED":
      case "POLICY_VIOLATION":
        return <AlertTriangle className="w-4 h-4 text-amber-400" />;
      case "APPROVAL_RESOLVED":
        return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
      default:
        return <ShieldAlert className="w-4 h-4 text-blue-400" />;
    }
  };

  return (
    <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-4 flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between pb-3 mb-2 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-gray-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-300">
            Live Gateway Activity
          </h3>
        </div>
        <span className="text-[11px] font-mono text-gray-400">
          {events.length} events
        </span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
        {events.length === 0 ? (
          <div className="h-40 flex flex-col items-center justify-center text-gray-400 text-xs">
            <Clock className="w-6 h-6 mb-1 text-gray-500 animate-pulse" />
            <span>Listening for agent transactions...</span>
          </div>
        ) : (
          events.map((ev, idx) => (
            <div
              key={`${ev.data?.id}-${ev.timestamp}-${idx}`}
              onClick={() => ev.data?.id && onSelectTx?.(ev.data.id)}
              className="p-2.5 rounded-lg bg-gray-950/60 border border-gray-800/80 hover:border-gray-700 transition-colors text-xs cursor-pointer group"
            >
              <div className="flex items-start justify-between gap-2 mb-1">
                <div className="flex items-center gap-1.5 font-semibold text-gray-200">
                  {getEventIcon(ev.type)}
                  <span className="font-mono text-[11px]">
                    {ev.type.replace(/_/g, " ")}
                  </span>
                </div>
                <span className="text-[10px] font-mono text-gray-400">
                  {formatTime(ev.timestamp)}
                </span>
              </div>
              <div className="flex items-center justify-between text-gray-300">
                <span className="truncate max-w-[140px] text-gray-400">
                  {ev.data?.merchant}
                </span>
                <span className="font-mono font-bold text-gray-200">
                  ${ev.data?.amount?.toFixed(2)}
                </span>
              </div>
              {ev.data?.policyResult?.triggeredRules?.length > 0 && (
                <div className="mt-1 text-[10px] text-amber-400/90 truncate flex items-center gap-1">
                  <ArrowRight className="w-2.5 h-2.5 flex-shrink-0" />
                  {ev.data.policyResult.triggeredRules[0]}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

