export interface JsonRpcRequest {
  jsonrpc: "2.0";
  id: number | string;
  method: string;
  params?: Record<string, unknown>;
}

export interface JsonRpcResponse<T = unknown> {
  jsonrpc: "2.0";
  id: number | string;
  result?: T;
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
  isError?: boolean;
}

export interface PayGuardClientConfig {
  baseUrl?: string;
  agentId?: string;
}

export interface PayGuardOrderParams {
  intent?: "CAPTURE" | "AUTHORIZE";
  amount: number;
  currency?: string;
  vendorEmail: string;
  description?: string;
}

export interface PayGuardEvaluationResult {
  status: "APPROVED_BY_POLICY" | "HELD_FOR_APPROVAL" | "BLOCKED";
  message: string;
  riskScore?: number;
  triggeredRules?: string[];
  paypalOrderId?: string;
  transactionId?: string;
}
