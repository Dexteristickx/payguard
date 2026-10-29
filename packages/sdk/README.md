# @payguard/sdk

Official TypeScript client SDK for **PayGuard** — The Agentic Spending Firewall & Policy Proxy for PayPal MCP.

[![npm version](https://img.shields.io/badge/npm-v0.1.0-blue.svg)](https://npmjs.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)

---

## Overview

`@payguard/sdk` enables AI agent builders (Gemini, Claude, GPT, LangChain) to route payment tool calls through the PayGuard policy proxy before they hit PayPal MCP servers. It enforces:
* **Velocity Limits:** Max 3 transactions per 10 minutes
* **Amount Thresholds:** Transactions over $50 trigger Human-in-the-Loop approvals
* **Vendor Trust Scoring:** Automatic blocking of malicious/phishing merchants

---

## Installation

```bash
npm install @payguard/sdk
# or
pnpm add @payguard/sdk
```

---

## Quickstart

```typescript
import { PayGuardClient } from "@payguard/sdk";

const client = new PayGuardClient({
  baseUrl: "http://localhost:3100", // PayGuard Gateway URL
  agentId: "sarah-shopping-agent",
});

// 1. Intercept an agent tool call before invoking PayPal
const verdict = await client.createGuardedOrder({
  amount: 400.00,
  currency: "USD",
  vendorEmail: "trusted-store@example.com",
  description: "AI Agent grocery order",
});

if (verdict.status === "APPROVED_BY_POLICY") {
  console.log("Order passed policies:", verdict.paypalOrderId);
} else if (verdict.status === "HELD_FOR_APPROVAL") {
  console.log("Held for human mobile approval:", verdict.transactionId);
} else {
  console.error("Blocked by firewall:", verdict.message);
}
```

---

## APIMatic Integration

This package contains the complete OpenAPI 3.0.3 specification in [`openapi.json`](./openapi.json).

To generate SDKs in **Python**, **C#**, **Go**, or **Java**:
1. Log in to [APIMatic Portal](https://app.apimatic.io).
2. Click **Import API** and upload `packages/sdk/openapi.json`.
3. Select your target platform and export the client library.

