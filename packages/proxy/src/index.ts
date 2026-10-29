import Fastify from "fastify";
import cors from "@fastify/cors";
import websocket from "@fastify/websocket";
import { config } from "./config.js";
import { interceptMcpRequest } from "./mcp-interceptor.js";
import {
  getAllTransactions,
  resolveApproval,
  subscribe,
} from "./approval-queue.js";
import type { JsonRpcRequest } from "./types.js";

// ─── Server Setup ────────────────────────────────────────────

const app = Fastify({
  logger: {
    transport: {
      target: "pino-pretty",
      options: { colorize: true, translateTime: "HH:MM:ss" },
    },
  },
});

await app.register(cors, { origin: true });
await app.register(websocket);

// ─── Health Check ────────────────────────────────────────────

app.get("/health", async () => ({
  status: "ok",
  service: "PayGuard MCP Proxy",
  version: "0.1.0",
  uptime: process.uptime(),
}));

// ─── MCP Proxy Endpoint (Core) ──────────────────────────────
// AI agents send JSON-RPC requests here instead of directly to PayPal MCP.

app.post("/v1/mcp", async (request, reply) => {
  const body = request.body as JsonRpcRequest;
  const agentId =
    (request.headers["x-agent-id"] as string) ?? "agent-default";

  app.log.info(
    { method: body?.method, agentId },
    "Incoming MCP request"
  );

  const response = await interceptMcpRequest(body, agentId);
  return reply.send(response);
});

// ─── Approval Webhook (Telegram Bot / Dashboard) ────────────
// Called when the human taps Approve or Reject.

app.post("/v1/approvals/:approvalId", async (request, reply) => {
  const { approvalId } = request.params as { approvalId: string };
  const { decision } = request.body as { decision: "approve" | "reject" };

  if (!["approve", "reject"].includes(decision)) {
    return reply.status(400).send({ error: "decision must be 'approve' or 'reject'" });
  }

  const resolved = resolveApproval(approvalId, decision === "approve");

  if (!resolved) {
    return reply.status(404).send({ error: "Approval not found or expired" });
  }

  app.log.info(
    { approvalId, decision },
    "Approval resolved"
  );

  return { approvalId, decision, status: "resolved" };
});

// ─── Dashboard API ───────────────────────────────────────────

app.get("/v1/transactions", async () => {
  return getAllTransactions();
});

// ─── Demo Trigger API (Dashboard 1-Click Demo Mode) ───────────

app.post("/v1/demo/run", async (_request, reply) => {
  const scenarios: Array<{
    name: string;
    agentId: string;
    toolCall: JsonRpcRequest;
  }> = [
    {
      name: "Scene 1: Normal grocery purchase ($12.00)",
      agentId: "sarah-shopping-agent",
      toolCall: {
        jsonrpc: "2.0",
        id: Date.now() + 1,
        method: "tools/call",
        params: {
          name: "create_order",
          arguments: {
            intent: "CAPTURE",
            purchase_units: [
              {
                amount: { currency_code: "USD", value: "12.00" },
                payee: { email_address: "legit-merchant@example.com" },
                description: "Weekly groceries",
              },
            ],
          },
        },
      },
    },
    {
      name: "Scene 2: Prompt-injected $400 subscription (HOLD)",
      agentId: "sarah-shopping-agent",
      toolCall: {
        jsonrpc: "2.0",
        id: Date.now() + 2,
        method: "tools/call",
        params: {
          name: "create_order",
          arguments: {
            intent: "CAPTURE",
            purchase_units: [
              {
                amount: { currency_code: "USD", value: "400.00" },
                payee: { email_address: "trusted-store@example.com" },
                description: "Premium AI subscription — auto-renew",
              },
            ],
          },
        },
      },
    },
    {
      name: "Scene 3: Phishing vendor $25 charge (BLOCK)",
      agentId: "sarah-shopping-agent",
      toolCall: {
        jsonrpc: "2.0",
        id: Date.now() + 3,
        method: "tools/call",
        params: {
          name: "create_order",
          arguments: {
            intent: "CAPTURE",
            purchase_units: [
              {
                amount: { currency_code: "USD", value: "25.00" },
                payee: { email_address: "phishing-shop@example.com" },
                description: "Account verification fee",
              },
            ],
          },
        },
      },
    },
  ];

  // Run in background with delays to produce animated live feed
  (async () => {
    for (const scenario of scenarios) {
      await interceptMcpRequest(scenario.toolCall, scenario.agentId);
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  })().catch((err) => app.log.error(err, "Error running demo sequence"));

  return reply.send({ status: "started", message: "3-scene demo simulation initiated" });
});

// ─── Real-Time WebSocket Feed (Dashboard) ────────────────────

app.get("/v1/ws", { websocket: true }, (connection) => {
  const socket = (connection as any).socket ?? connection;
  app.log.info("Dashboard WebSocket connected");

  const unsubscribe = subscribe((event) => {
    try {
      socket.send(JSON.stringify(event));
    } catch {
      // client may have closed
    }
  });

  socket.on("close", () => {
    unsubscribe();
    app.log.info("Dashboard WebSocket disconnected");
  });
});

// ─── Server Start ────────────────────────────────────────────

const start = async () => {
  try {
    await app.listen({ port: config.PORT, host: config.HOST });
    app.log.info(`🛡️  PayGuard Proxy running on http://${config.HOST}:${config.PORT}`);
    app.log.info(`📊 Dashboard WS:  ws://${config.HOST}:${config.PORT}/v1/ws`);
    app.log.info(`🔌 MCP Endpoint:  POST http://${config.HOST}:${config.PORT}/v1/mcp`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
