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
  total: number;
  totalCount: number;
  totalVolume: number;
  blocked: number;
  blockedCount: number;
  held: number;
  heldCount: number;
  completed: number;
  approvedCount: number;
  avgRisk: number;
  avgRiskScore: number;
}

