import { useMemo, useState } from "react";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";
import { ModuleRegistry, AllCommunityModule, type ColDef } from "ag-grid-community";
import type { TransactionRecord } from "../types";
import { StatusBadge } from "./StatusBadge";
import { RiskGauge } from "./RiskGauge";

// Register AG Grid Community Modules
ModuleRegistry.registerModules([AllCommunityModule]);

interface Props {
  transactions: TransactionRecord[];
}

export function TransactionGrid({ transactions }: Props) {
  const [processingId, setProcessingId] = useState<string | null>(null);

  const handleApproval = async (approvalId: string, decision: "approve" | "reject") => {
    setProcessingId(approvalId);
    try {
      await fetch(`/v1/approvals/${approvalId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision }),
      });
    } catch (err) {
      console.error("Approval error:", err);
    } finally {
      setProcessingId(null);
    }
  };

  const columnDefs = useMemo<ColDef<TransactionRecord>[]>(
    () => [
      {
        headerName: "Time",
        field: "timestamp",
        width: 110,
        cellRenderer: (params: { value: number }) => (
          <span className="font-mono text-xs text-slate-400">
            {new Date(params.value).toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            })}
          </span>
        ),
        sortable: true,
        sort: "desc",
      },
      {
        headerName: "Agent ID",
        field: "agentId",
        width: 170,
        cellRenderer: (params: { value: string }) => (
          <span className="font-mono text-xs text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20 truncate">
            {params.value}
          </span>
        ),
      },
      {
        headerName: "Merchant / Payee",
        field: "merchant",
        flex: 1,
        minWidth: 200,
        cellRenderer: (params: { value: string }) => (
          <span className="text-xs font-mono font-medium text-slate-100 tracking-wide truncate">
            {params.value}
          </span>
        ),
      },
      {
        headerName: "Amount",
        field: "amount",
        width: 120,
        cellRenderer: (params: { value: number; data: TransactionRecord }) => (
          <span className="font-mono text-xs font-bold text-slate-100">
            ${params.value.toFixed(2)}{" "}
            <span className="text-[10px] font-normal text-slate-500">
              {params.data.currency}
            </span>
          </span>
        ),
        sortable: true,
      },
      {
        headerName: "Risk Score",
        field: "policyResult.riskScore",
        width: 130,
        cellRenderer: (params: { data: TransactionRecord }) => (
          <RiskGauge score={params.data.policyResult.riskScore} />
        ),
        sortable: true,
      },
      {
        headerName: "Verdict / Status",
        field: "status",
        width: 140,
        cellRenderer: (params: { data: TransactionRecord }) => (
          <StatusBadge status={params.data.status} />
        ),
      },
      {
        headerName: "Actions",
        width: 180,
        cellRenderer: (params: { data: TransactionRecord }) => {
          const tx = params.data;
          if (tx.status === "HELD" && tx.approvalId) {
            const isProcessing = processingId === tx.approvalId;
            return (
              <div className="flex items-center gap-1.5">
                <button
                  disabled={isProcessing}
                  onClick={() => handleApproval(tx.approvalId!, "approve")}
                  className="px-2.5 py-1 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-medium transition-all active:scale-95 cursor-pointer"
                >
                  ✓ Approve
                </button>
                <button
                  disabled={isProcessing}
                  onClick={() => handleApproval(tx.approvalId!, "reject")}
                  className="px-2.5 py-1 rounded bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-xs font-medium transition-all active:scale-95 cursor-pointer"
                >
                  ✕ Reject
                </button>
              </div>
            );
          }

          if (tx.paypalOrderId) {
            return (
              <span className="text-[11px] font-mono text-slate-500">
                Order #{tx.paypalOrderId.slice(-6)}
              </span>
            );
          }

          return <span className="text-[11px] text-slate-600">—</span>;
        },
      },
    ],
    [processingId]
  );

  const defaultColDef = useMemo<ColDef>(
    () => ({
      resizable: true,
      sortable: false,
      filter: false,
    }),
    []
  );

  return (
    <div className="ag-theme-quartz-dark w-full h-full absolute inset-0">
      <AgGridReact
        rowData={transactions}
        columnDefs={columnDefs}
        defaultColDef={defaultColDef}
        animateRows={true}
        rowSelection="single"
        getRowId={(params) => params.data.id}
        domLayout="normal"
        suppressCellFocus={true}
      />
    </div>
  );
}
