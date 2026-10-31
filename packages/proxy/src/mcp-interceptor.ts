import { randomUUID } from "node:crypto";
import { z } from "zod";
import { evaluatePolicy, type PolicyInput } from "./policy-engine.js";
import {
  recordTransaction,
  updateTransactionStatus,
  createApprovalRequest,
} from "./approval-queue.js";
import { createPayPalOrder } from "./paypal-forwarder.js";
import type {
  JsonRpcRequest,
  JsonRpcResponse,
  McpToolCallParams,
  TransactionRecord,
  PayPalCreateOrderRequest,
} from "./types.js";

// ─── MCP Tool Call Schema Validation ─────────────────────────

const toolCallParamsSchema = z.object({
  name: z.string(),
  arguments: z.record(z.unknown()),
});

// ─── Extract Policy-Relevant Data from Tool Call ─────────────

function extractPolicyInput(
  params: McpToolCallParams,
  agentId: string
): PolicyInput | null {
  // We intercept payment-related tool calls
  const paymentTools = [
    "create_order",
    "paypal_create_order",
    "capture_payment",
    "process_payment",
  ];

  if (!paymentTools.includes(params.name)) {
    return null; // Not a payment tool — pass through
  }

  const args = params.arguments;

  // Extract amount from PayPal order structure
  const purchaseUnits = args.purchase_units as
    | Array<{ amount?: { value?: string; currency_code?: string }; payee?: { email_address?: string } }>
    | undefined;

  const firstUnit = purchaseUnits?.[0];
  const amount = parseFloat(firstUnit?.amount?.value ?? "0");
  const currency = firstUnit?.amount?.currency_code ?? "USD";
  const vendorEmail =
    firstUnit?.payee?.email_address ?? "unknown-merchant@example.com";
  const intent = (args.intent as string) ?? "CAPTURE";

  return { agentId, amount, currency, vendorEmail, intent };
}

// ─── Main Interceptor ────────────────────────────────────────

export async function interceptMcpRequest(
  request: JsonRpcRequest,
  agentId: string = "agent-default"
): Promise<JsonRpcResponse> {
  // ── Non-tool-call methods pass through unchanged ──
  if (request.method !== "tools/call") {
    return {
      jsonrpc: "2.0",
      id: request.id,
      result: {
        content: [
          {
            type: "text",
            text: `PayGuard: Method "${request.method}" forwarded to PayPal MCP server.`,
          },
        ],
      },
    };
  }

  // ── Parse and validate tool call ──
  const parseResult = toolCallParamsSchema.safeParse(request.params);
  if (!parseResult.success) {
    return {
      jsonrpc: "2.0",
      id: request.id,
      error: {
        code: -32602,
        message: "Invalid MCP tool call parameters",
        data: parseResult.error.flatten(),
      },
    };
  }

  const toolParams = parseResult.data as McpToolCallParams;
  const policyInput = extractPolicyInput(toolParams, agentId);

  // ── Non-payment tool calls pass through ──
  if (!policyInput) {
    return {
      jsonrpc: "2.0",
      id: request.id,
      result: {
        content: [
          {
            type: "text",
            text: `PayGuard: Tool "${toolParams.name}" is not payment-related. Forwarded.`,
          },
        ],
      },
    };
  }

  // ── Run Policy Engine ──
  const policyResult = evaluatePolicy(policyInput);
  const transactionId = randomUUID().slice(0, 12);

  const transactionRecord: TransactionRecord = {
    id: transactionId,
    agentId,
    timestamp: Date.now(),
    merchant: policyInput.vendorEmail,
    amount: policyInput.amount,
    currency: policyInput.currency,
    intent: policyInput.intent,
    policyResult,
    status: "COMPLETED", // will be updated according to verdict
  };

  // ── ALLOW: Forward to PayPal immediately ──
  if (policyResult.verdict === "ALLOW") {
    try {
      const orderRequest: PayPalCreateOrderRequest = {
        intent: "CAPTURE",
        purchase_units: [
          {
            amount: {
              currency_code: policyInput.currency,
              value: policyInput.amount.toFixed(2),
            },
            payee: { email_address: policyInput.vendorEmail },
          },
        ],
      };

      const paypalOrder = await createPayPalOrder(orderRequest);
      transactionRecord.status = "COMPLETED";
      transactionRecord.paypalOrderId = paypalOrder.id;
      recordTransaction(transactionRecord);

      return {
        jsonrpc: "2.0",
        id: request.id,
        result: {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                status: "APPROVED_BY_POLICY",
                paypalOrderId: paypalOrder.id,
                amount: `$${policyInput.amount.toFixed(2)}`,
                message: "PayGuard: All policies passed. Order created.",
              }),
            },
          ],
        },
      };
    } catch (error) {
      transactionRecord.status = "BLOCKED";
      recordTransaction(transactionRecord);

      return {
        jsonrpc: "2.0",
        id: request.id,
        error: {
          code: -32000,
          message: `PayPal API error: ${(error as Error).message}`,
        },
      };
    }
  }

  // ── BLOCK: Reject immediately ──
  if (policyResult.verdict === "BLOCK") {
    transactionRecord.status = "BLOCKED";
    recordTransaction(transactionRecord);

    return {
      jsonrpc: "2.0",
      id: request.id,
      result: {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              status: "BLOCKED",
              reason: policyResult.reason,
              triggeredRules: policyResult.triggeredRules,
              riskScore: policyResult.riskScore,
              message:
                "PayGuard: Transaction blocked. High-risk activity detected.",
            }),
          },
        ],
        isError: true,
      },
    };
  }

  // ── HOLD: Queue for human approval ──
  const approvalPromise = createApprovalRequest(transactionRecord);

  // Background resolution hook
  approvalPromise.then(async (approved) => {
    if (approved) {
      try {
        const orderRequest: PayPalCreateOrderRequest = {
          intent: "CAPTURE",
          purchase_units: [
            {
              amount: {
                currency_code: policyInput.currency,
                value: policyInput.amount.toFixed(2),
              },
              payee: { email_address: policyInput.vendorEmail },
            },
          ],
        };
        const paypalOrder = await createPayPalOrder(orderRequest);
        updateTransactionStatus(transactionId, "COMPLETED", paypalOrder.id);
      } catch {
        updateTransactionStatus(transactionId, "BLOCKED");
      }
    }
  });

  return {
    jsonrpc: "2.0",
    id: request.id,
    result: {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            status: "HELD_FOR_APPROVAL",
            transactionId,
            amount: `$${policyInput.amount.toFixed(2)}`,
            merchant: policyInput.vendorEmail,
            triggeredRules: policyResult.triggeredRules,
            riskScore: policyResult.riskScore,
            message:
              "PayGuard: Transaction held. Awaiting human approval via mobile notification.",
          }),
        },
      ],
    },
  };
}
