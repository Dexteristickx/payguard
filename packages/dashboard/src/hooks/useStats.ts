import { useMemo } from "react";
import type { TransactionRecord, DashboardStats } from "../types";

export function useStats(transactions: TransactionRecord[]): DashboardStats {
  return useMemo(() => {
    let totalCount = transactions.length;
    let totalVolume = 0;
    let blockedCount = 0;
    let heldCount = 0;
    let approvedCount = 0;
    let totalRisk = 0;

    for (const tx of transactions) {
      totalVolume += tx.amount || 0;
      totalRisk += tx.policyResult?.riskScore || 0;

      if (tx.status === "BLOCKED") {
        blockedCount++;
      } else if (tx.status === "HELD") {
        heldCount++;
      } else if (tx.status === "COMPLETED" || tx.status === "APPROVED") {
        approvedCount++;
      }
    }

    const avgRiskScore = totalCount > 0 ? Math.round(totalRisk / totalCount) : 0;

    return {
      total: totalCount,
      totalCount,
      totalVolume,
      blocked: blockedCount,
      blockedCount,
      held: heldCount,
      heldCount,
      completed: approvedCount,
      approvedCount,
      avgRisk: avgRiskScore,
      avgRiskScore,
    };
  }, [transactions]);
}

