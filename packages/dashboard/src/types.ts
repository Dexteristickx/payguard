export type PolicyVerdict = "ALLOW" | "HOLD" | "BLOCK";

export interface PolicyResult {
  verdict: PolicyVerdict;
  triggeredRules: string[];
  riskScore: number; // 0–100
  reason: string;
}

export type TransactionStatus =
  | "COMPLETED"
  | "HELD"
  | "APPROVED"
  | "REJECTED"
  | "BLOCKED"
  | "TIMEOUT";

export interface TransactionRecord {
  id: string;
  agentId: string;
  timestamp: number;
  merchant: string;
  amount: number;
  currency: string;
  intent: string;
  policyResult: PolicyResult;
  status: TransactionStatus;
  paypalOrderId?: string;
  approvalId?: string;
}

export type DashboardEventType =
  | "TRANSACTION_NEW"
  | "TRANSACTION_UPDATED"
  | "POLICY_VIOLATION"
  | "APPROVAL_REQUESTED"
  | "APPROVAL_RESOLVED";

export interface DashboardEvent {
  type: DashboardEventType;
  timestamp: number;
  data: TransactionRecord;
}

export interface DashboardStats {
  totalCount: number;
  totalVolume: number;
  blockedCount: number;
  heldCount: number;
  approvedCount: number;
  avgRiskScore: number;
}

