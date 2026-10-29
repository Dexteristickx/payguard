# PayGuard 🛡️
### *The AI Firewall & Policy Proxy for PayPal Agentic Commerce*

> **"AP2 proves the agent signed the payment. PayGuard proves the agent should have."**

[![PayPal AI Hackathon](https://img.shields.io/badge/PayPal_AI_Hackathon-2026-0070BA.svg)](https://developer.paypal.com)
[![AG Grid Community v33](https://img.shields.io/badge/AG_Grid-v33-orange.svg)](https://ag-grid.com)
[![TypeScript 5.7](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://typescriptlang.org)
[![Fastify 5](https://img.shields.io/badge/Fastify-5.1-black.svg)](https://fastify.dev)
[![Vite 6](https://img.shields.io/badge/Vite-6.0-purple.svg)](https://vitejs.dev)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)

---

## 📌 Executive Summary

With the launch of PayPal's official **Model Context Protocol (MCP)** servers and the **Agent Payments Protocol (AP2)**, AI shopping agents can autonomously initiate orders, process checkouts, and manage recurring payments.

However, a dangerous security gap has emerged:
* **AP2 and cryptographic mandates** prove that an agent *signed* a transaction.
* **They do NOT prove the agent made an unmanipulated decision.**

When an AI agent encounters indirect prompt injection on a compromised merchant webpage (hidden CSS instructions, poisoned product descriptions, or spoofed reviews), it can be coerced into generating authentic payment mandates for unauthorized, overpriced, or fraudulent items.

**PayGuard** is the missing policy firewall. Operating at the MCP JSON-RPC protocol layer, it intercepts agent tool calls before they reach PayPal servers, evaluates them against semantic policy rules, and triggers instant mobile Human-in-the-Loop approvals for anomalous behavior.

---

## 🏗️ Architecture

```
                                  ┌───────────────────────────────┐
                                  │       AI Shopping Agent       │
                                  │    (Claude / Gemini / GPT)    │
                                  └───────────────┬───────────────┘
                                                  │
                                                  │ MCP JSON-RPC: tools/call { create_order }
                                                  ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                   PayGuard MCP Proxy Gateway                                    │
│                                                                                                 │
│  1. Parse & validate tool call arguments (purchase_units, payee, amount)                        │
│  2. Run Policy Engine:                                                                          │
│     • Amount Threshold:     Flags single transactions > $50                                     │
│     • Velocity Check:       Limits agents to ≤ 3 transactions per 10-minute window              │
│     • Vendor Trust Score:   Evaluates merchant trust (< 70 triggers HOLD; < 30 BLOCKS)          │
└──────────────────┬──────────────────────────────┬───────────────────────────────┬───────────────┘
                   │ [ALLOW: Pass]                │ [HOLD: Risk >= 30]            │ [BLOCK: Risk >= 70]
                   ▼                              ▼                               ▼
       ┌───────────────────────┐      ┌───────────────────────┐      ┌───────────────────────┐
       │   PayPal Orders API   │      │ Human-in-the-Loop Bot │      │ Transaction Aborted   │
       │   (Sandbox v2 Rail)   │      │ (Telegram Push Alert) │      │ (Error returned to AI)│
       └───────────────────────┘      └───────────┬───────────┘      └───────────────────────┘
                                                  │
                                                  │ [Approve / Reject Action]
                                                  ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                 PayGuard Real-Time Dashboard                                    │
│                    Powered by AG Grid Community v33 • Quartz Dark Theme                         │
│             Live WebSocket Event Bus • Inline Audit Logs • 1-Click 3-Act Demo Trigger           │
└─────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## ⚡ The 3-Act Demo Walkthrough

PayGuard features an automated 3-act demo built right into the dashboard and CLI:

1. **🟢 Scene 1: Normal Everyday Purchase ($12.00)**
   * Sarah's agent buys groceries from `legit-merchant@example.com` (Trust: 95/100).
   * **Result:** Risk 0/100. Status: `APPROVED_BY_POLICY`. Order created on PayPal Sandbox.
2. **🟡 Scene 2: Prompt-Injected Attack ($400.00)**
   * A merchant injects hidden DOM text tricking the agent into purchasing an expensive recurring subscription.
   * **Result:** Triggers `AMOUNT_THRESHOLD`. Risk 40/100. Status: `HELD_FOR_APPROVAL`.
   * Sarah receives an immediate push notification with `[ ✅ Approve ]` and `[ ❌ Reject ]` buttons.
   * She taps **Reject** $\rightarrow$ Transaction aborted before reaching PayPal rails.
3. **🔴 Scene 3: Phishing / Malicious Scam ($25.00)**
   * A scam site attempts to extract an account verification fee via `phishing-shop@example.com` (Trust: 12/100).
   * **Result:** Triggers `CRITICAL_VENDOR_RISK`. Risk 75/100. Status: `BLOCKED`.

---

## 📦 Monorepo Structure

```
payguard/
├── packages/
│   ├── proxy/                 # Core Fastify MCP JSON-RPC Proxy & Policy Engine
│   │   ├── src/
│   │   │   ├── policy-engine.ts       # 3 policy rules (Threshold, Velocity, Trust)
│   │   │   ├── mcp-interceptor.ts     # JSON-RPC tools/call interceptor
│   │   │   ├── approval-queue.ts      # Async hold queue & WebSocket event emitter
│   │   │   ├── paypal-forwarder.ts    # PayPal Sandbox Orders API client
│   │   │   ├── index.ts               # Fastify server, OpenAPI & REST endpoints
│   │   │   └── demo/run-demo.ts       # CLI 3-scene simulation runner
│   │   ├── openapi.json               # Exported OpenAPI 3.0.3 specification
│   │   └── package.json
│   │
│   ├── dashboard/             # Real-Time AG Grid Fintech Security Console
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   ├── TransactionGrid.tsx # AG Grid v33 with inline action buttons
│   │   │   │   ├── Header.tsx          # Live status & 1-Click Demo Mode button
│   │   │   │   ├── ActivityFeed.tsx    # Streaming live event log
│   │   │   │   └── StatCard.tsx        # High-level financial & risk metrics
│   │   │   ├── hooks/useWebSocket.ts   # Auto-reconnecting WebSocket hook
│   │   │   └── App.tsx                 # Main layout with flex-1 min-h-0 constraint
│   │   └── vite.config.ts             # Vite proxy configuration
│   │
│   ├── telegram-bot/          # Human-in-the-Loop Mobile Gateway
│   │   ├── src/
│   │   │   ├── bot.ts                 # grammY Telegram bot with inline keyboards
│   │   │   └── alert-formatter.ts     # Rich markdown notification templates
│   │   └── package.json
│   │
│   └── sdk/                   # APIMatic-Ready Client SDK
│       ├── src/
│       │   ├── index.ts               # PayGuardClient for agent builders
│       │   └── types.ts               # TypeScript interfaces
│       ├── openapi.json               # Spec ready for APIMatic export
│       └── package.json
│
├── .env.example               # Template environment configuration
├── pnpm-workspace.yaml        # Workspace configuration
└── README.md
```

---

## 🚀 Quickstart Guide

### 1. Prerequisites
* Node.js >= 20.0.0
* `pnpm` >= 9.0.0

### 2. Install & Configure
```bash
# Clone and install dependencies
git clone https://github.com/your-username/payguard.git
cd payguard
pnpm install

# Setup environment (defaults run in offline simulation mode out-of-the-box)
cp .env.example .env
```

### 3. Launch Services
```bash
# Terminal 1: Launch MCP Proxy Gateway
pnpm dev

# Terminal 2: Launch AG Grid Dashboard
pnpm dev:dash
```

Open **`http://localhost:5173`** in your browser.

### 4. Run the 3-Scene Demo
You can trigger the demo in two ways:
* **Option A (UI):** Click the **`Run 3-Act Demo`** button in the dashboard header.
* **Option B (CLI):** Run `pnpm demo` in your terminal.

Watch transactions animate into the AG Grid console in real time!

---

## 🏆 Hackathon Sponsor Integrations

* **PayPal:** Intercepts MCP JSON-RPC tool calls and connects directly to the PayPal Sandbox Orders API v2 with automatic fallback simulation.
* **AG Grid:** Core of the real-time security dashboard using AG Grid Community v33 (Quartz Dark theme, custom column renderers, pinned action buttons, and pagination).
* **APIMatic:** OpenAPI 3.0.3 specification exported in `packages/sdk/openapi.json` and hosted live at `/v1/openapi.json` for instant SDK generation across Python, C#, and Go.
* **Telegram:** Mobile Human-in-the-Loop notification flow with 1-tap inline biometric decision buttons.

---

## 📄 License
MIT © 2026 PayGuard Contributors

