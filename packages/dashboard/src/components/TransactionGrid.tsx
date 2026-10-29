import React, { useMemo } from "react";
import { AgGridReact } from "ag-grid-react";
import {
  ColDef,
  ModuleRegistry,
  AllCommunityModule,
  ICellRendererParams,
} from "ag-grid-community";
import type { TransactionRecord } from "../types";
import { StatusBadge } from "./StatusBadge";
import { RiskGauge } from "./RiskGauge";
import { Check, X, ShieldAlert } from "lucide-react";

// Register AG Grid Community modules
ModuleRegistry.registerModules([AllCommunityModule]);

interface TransactionGridProps {
  transactions: TransactionRecord[];
  onResolveApproval?: (approvalId: string, decision: "approve" | "reject") => void;
  selectedId?: string;
}

export const TransactionGrid: React.FC<TransactionGridProps> = ({
  transactions,
  onResolveApproval,
}) => {
  const columnDefs: ColDef<TransactionRecord>[] = useMemo(
    () => [
      {
        field: "timestamp",
        headerName: "Time",
        width: 110,
        valueFormatter: (params) => {
          if (!params.value) return "";
          return new Date(params.value).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          });
        },
        sort: "desc",
      },
      {
        field: "agentId",
        headerName: "Agent ID",
        width: 170,
        cellRenderer: (params: ICellRendererParams<TransactionRecord>) => (
          <span className="font-mono text-xs text-blue-400 bg-blue-950/40 px-2 py-0.5 rounded border border-blue-900/50">
            {params.value}
          </span>
        ),
      },
      {
        field: "merchant",
        headerName: "Merchant / Payee",
        flex: 1,
        minWidth: 200,
        cellRenderer: (params: ICellRendererParams<TransactionRecord>) => (
          <div className="flex items-center gap-2 truncate">
            <span className="font-mono text-xs text-gray-200">
              {params.value}
            </span>
          </div>
        ),
      },
      {
        field: "amount",
        headerName: "Amount",
        width: 120,
        cellRenderer: (params: ICellRendererParams<TransactionRecord>) => {
          const val = params.value as number;
          const isLarge = val > 50;
          return (
            <span
              className={`font-mono font-bold text-xs ${
                isLarge ? "text-amber-300" : "text-emerald-400"
              }`}
            >
              ${val?.toFixed(2)}{" "}
              <span className="text-[10px] text-gray-400 font-normal">
                {params.data?.currency || "USD"}
              </span>
            </span>
          );
        },
      },
      {
        field: "policyResult.riskScore",
        headerName: "Risk Score",
        width: 160,
        cellRenderer: (params: ICellRendererParams<TransactionRecord>) => (
          <RiskGauge score={params.data?.policyResult?.riskScore ?? 0} />
        ),
      },
      {
        field: "status",
        headerName: "Verdict / Status",
        width: 150,
        cellRenderer: (params: ICellRendererParams<TransactionRecord>) => (
          <StatusBadge status={params.value} />
        ),
      },
      {
        field: "policyResult.triggeredRules",
        headerName: "Triggered Policies",
        flex: 1.5,
        minWidth: 260,
        cellRenderer: (params: ICellRendererParams<TransactionRecord>) => {
          const rules: string[] = params.value || [];
          if (!rules || rules.length === 0) {
            return (
              <span className="text-xs text-gray-400 italic">None (Clean pass)</span>
            );
          }
          return (
            <div className="flex flex-wrap gap-1 items-center h-full py-1">
              {rules.map((rule, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded bg-gray-800 text-amber-300 border border-amber-900/40 truncate max-w-[240px]"
                  title={rule}
                >
                  <ShieldAlert className="w-2.5 h-2.5 text-amber-400 flex-shrink-0" />
                  {rule.split(":")[0]}
                </span>
              ))}
            </div>
          );
        },
      },
      {
        headerName: "Actions",
        width: 150,
        pinned: "right",
        cellRenderer: (params: ICellRendererParams<TransactionRecord>) => {
          const tx = params.data;
          if (!tx || tx.status !== "HELD" || !tx.approvalId) {
            return (
              <span className="text-[11px] text-gray-400 font-mono">
                {tx?.paypalOrderId ? `Order #${tx.paypalOrderId.slice(-6)}` : "—"}
              </span>
            );
          }
          return (
            <div className="flex items-center gap-1.5 h-full">
              <button
                onClick={() => onResolveApproval?.(tx.approvalId!, "approve")}
                className="px-2 py-0.5 text-[11px] font-bold rounded bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-0.5 transition shadow"
                title="Authorize and forward to PayPal"
              >
                <Check className="w-3 h-3" /> Approve
              </button>
              <button
                onClick={() => onResolveApproval?.(tx.approvalId!, "reject")}
                className="px-2 py-0.5 text-[11px] font-bold rounded bg-rose-700 hover:bg-rose-600 text-white flex items-center gap-0.5 transition shadow"
                title="Reject transaction"
              >
                <X className="w-3 h-3" /> Reject
              </button>
            </div>
          );
        },
      },
    ],
    [onResolveApproval]
  );

  const defaultColDef = useMemo<ColDef>(
    () => ({
      sortable: true,
      filter: true,
      resizable: true,
    }),
    []
  );

  return (
    <div className="w-full h-full ag-theme-quartz-dark rounded-xl overflow-hidden border border-gray-800 shadow-xl">
      <AgGridReact
        rowData={transactions}
        columnDefs={columnDefs}
        defaultColDef={defaultColDef}
        rowSelection="single"
        animateRows={true}
        pagination={true}
        paginationPageSize={20}
        getRowId={(params) => params.data.id}
      />
    </div>
  );
};

