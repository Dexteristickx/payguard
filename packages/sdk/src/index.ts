import type {
  PayGuardClientConfig,
  JsonRpcRequest,
  JsonRpcResponse,
  PayGuardOrderParams,
  PayGuardEvaluationResult,
} from "./types.js";

export * from "./types.js";

export class PayGuardClient {
  private baseUrl: string;
  private agentId: string;

  constructor(config: PayGuardClientConfig = {}) {
    this.baseUrl = config.baseUrl || "http://localhost:3100";
    this.agentId = config.agentId || "agent-default";
  }

  /**
   * Intercept an arbitrary MCP tool call before it reaches the PayPal MCP server.
   */
  async interceptToolCall(
    toolName: string,
    toolArgs: Record<string, unknown>
  ): Promise<JsonRpcResponse> {
    const requestPayload: JsonRpcRequest = {
      jsonrpc: "2.0",
      id: Date.now(),
      method: "tools/call",
      params: {
        name: toolName,
        arguments: toolArgs,
      },
    };

    const res = await fetch(`${this.baseUrl}/v1/mcp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Agent-Id": this.agentId,
      },
      body: JSON.stringify(requestPayload),
    });

    if (!res.ok) {
      throw new Error(`PayGuard Gateway returned HTTP ${res.status}: ${res.statusText}`);
    }

    return (await res.json()) as JsonRpcResponse;
  }

  /**
   * High-level helper: Safely create a PayPal order subject to PayGuard policies.
   */
  async createGuardedOrder(
    params: PayGuardOrderParams
  ): Promise<PayGuardEvaluationResult> {
    const mcpResponse = await this.interceptToolCall("create_order", {
      intent: params.intent || "CAPTURE",
      purchase_units: [
        {
          amount: {
            currency_code: params.currency || "USD",
            value: params.amount.toFixed(2),
          },
          payee: {
            email_address: params.vendorEmail,
          },
          description: params.description || "Agentic purchase",
        },
      ],
    });

    const contentText = (mcpResponse.result as any)?.content?.[0]?.text;
    if (contentText) {
      try {
        return JSON.parse(contentText) as PayGuardEvaluationResult;
      } catch {
        // Fallback
      }
    }

    if (mcpResponse.error) {
      return {
        status: "BLOCKED",
        message: mcpResponse.error.message,
      };
    }

    return {
      status: "APPROVED_BY_POLICY",
      message: "Order authorized by policy",
    };
  }

  /**
   * Resolve a held transaction approval.
   */
  async resolveApproval(
    approvalId: string,
    decision: "approve" | "reject"
  ): Promise<boolean> {
    const res = await fetch(`${this.baseUrl}/v1/approvals/${approvalId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decision }),
    });
    return res.ok;
  }

  /**
   * Fetch recent transaction ledger.
   */
  async getTransactions() {
    const res = await fetch(`${this.baseUrl}/v1/transactions`);
    if (!res.ok) throw new Error(`Failed to fetch transactions: ${res.statusText}`);
    return res.json();
  }

  /**
   * Fetch the OpenAPI 3.0 specification from the running gateway.
   */
  async getOpenApiSpec() {
    const res = await fetch(`${this.baseUrl}/v1/openapi.json`);
    if (!res.ok) throw new Error(`Failed to fetch OpenAPI spec: ${res.statusText}`);
    return res.json();
  }
}

