// ─── MCP JSON-RPC Types ───────────────────────────────────────

export interface JsonRpcRequest {
  jsonrpc: "2.0";
  id: number | string;
  method: string;
  params?: Record<string, unknown>;
}

export interface JsonRpcResponse {
  jsonrpc: "2.0";
  id: number | string;
  result?: unknown;
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
  isError?: boolean;
}

export interface McpToolCallParams {
  name: string;
  arguments: Record<string, unknown>;
}

// ─── PayPal Order Types (Simplified) ─────────────────────────

export interface PayPalPurchaseUnit {
  amount: {
    currency_code: string;
    value: string;
  };
  payee?: {
    email_address?: string;
    merchant_id?: string;
  };
  description?: string;
}

export interface PayPalCreateOrderRequest {
  intent: "CAPTURE" | "AUTHORIZE";
  purchase_units: PayPalPurchaseUnit[];
}

export interface PayPalOrderResponse {
  id: string;
  status: string;
  links: Array<{ href: string; rel: string; method: string }>;
}

// ─── PayGuard Internal Types ─────────────────────────────────

export type PolicyVerdict = "ALLOW" | "HOLD" | "BLOCK";

export interface PolicyResult {
  verdict: PolicyVerdict;
  triggeredRules: string[];
  riskScore: number; // 0–100
  reason: string;
}

export interface TransactionRecord {
  id: string;
  agentId: string;
  timestamp: number;
  merchant: string;
  amount: number;
  currency: string;
  intent: string;
  policyResult: PolicyResult;
  status: "COMPLETED" | "HELD" | "APPROVED" | "REJECTED" | "BLOCKED" | "TIMEOUT";
  paypalOrderId?: string;
  approvalId?: string;
}

export interface PendingApproval {
  approvalId: string;
  transactionId: string;
  resolve: (approved: boolean) => void;
  timeout: ReturnType<typeof setTimeout>;
}

// ─── Dashboard Event Types ───────────────────────────────────

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
