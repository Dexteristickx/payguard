# PayGuard — Devpost Submission Package

This document contains the finalized, copy-paste ready text for the **PayPal AI Hackathon** ("Build What's Next with PayPal and AI") Devpost submission.

---

## 1. Project Overview

* **Project Title:** `PayGuard — The AI Firewall for PayPal Agentic Commerce`
* **Tagline:** `AP2 proves the agent signed the payment. PayGuard proves the agent should have.`
* **Built With:** `paypal`, `mcp`, `ap2`, `typescript`, `fastify`, `react`, `ag-grid`, `vite`, `telegram`, `pnpm`, `apimatic`, `tailwindcss`, `websocket`

---

## 2. Inspiration (250 words)

In 2025, PayPal launched AP2 (Agent Payments Protocol) and official MCP servers, enabling AI agents to autonomously create orders, capture payments, and manage invoices on behalf of consumers. This is the future of commerce — but it introduced a critical blind spot.

AP2's cryptographic mandates prove that an agent *signed* a transaction. They do not prove the agent made a *safe, unmanipulated decision*. When a consumer's AI shopping agent visits a merchant website laced with indirect prompt injection — hidden text, poisoned metadata, adversarial DOM elements — the agent can be coerced into overpaying, subscribing to recurring charges, or purchasing from fraudulent vendors. The cryptographic signature is valid. The payment goes through. The consumer loses money.

We asked: **where is the policy layer between the agent's reasoning and PayPal's payment rails?** The answer was: it doesn't exist yet. Developers integrating PayPal's MCP tools have no spending firewalls, no velocity limits, no vendor trust scoring, and no human-in-the-loop approval flow for high-risk transactions.

PayGuard fills that gap. It is a drop-in MCP proxy that intercepts every payment tool call *before* it reaches PayPal's servers, evaluates it against configurable security policies, and either forwards, holds for human approval, or blocks the transaction outright.

---

## 3. What It Does (200 words)

PayGuard is an intelligent gateway that sits between any AI agent (Claude, Gemini, GPT) and PayPal's MCP server. It operates at the MCP JSON-RPC protocol layer, parsing `tools/call` payloads for payment-related methods (`create_order`, `capture_payment`, `process_payment`).

Every intercepted transaction is evaluated against three real-time policy rules:
1. **Amount Threshold:** Transactions exceeding a configurable limit (default $50) are held for human approval.
2. **Velocity Check:** Agents making more than 3 transactions in 10 minutes trigger a hold, preventing runaway spending loops.
3. **Vendor Trust Scoring:** Merchants with trust scores below 70/100 are flagged; known-malicious vendors (score < 30) are blocked outright.

When a transaction is held, PayGuard sends an instant push notification to the user's phone via Telegram with one-tap **[Approve]** and **[Reject]** buttons. The approval webhook resolves the transaction in real time.

All activity streams to a live AG Grid security dashboard with risk gauges, policy violation badges, and filterable audit logs — giving both consumers and developers full visibility into their agent's spending behavior.

---

## 4. How We Built It (200 words)

PayGuard is an enterprise TypeScript monorepo with four distinct packages:

* **@payguard/proxy:** A Fastify server that intercepts MCP JSON-RPC `tools/call` requests. The policy engine evaluates each transaction against configurable rules using a sliding-window velocity tracker and a vendor trust database. The approval queue holds pending transactions in async state, resolving them when the human-in-the-loop webhook fires. The PayPal forwarder handles OAuth2 token management and creates orders via the PayPal Sandbox Orders API.
* **@payguard/telegram-bot:** A real-time WebSocket client that connects to the proxy's event bus. When a `HELD_FOR_APPROVAL` event fires, it sends a rich Telegram message with inline approval buttons. Button callbacks POST to the proxy's `/v1/approvals/:id` endpoint.
* **@payguard/dashboard:** A React + Vite frontend powered by AG Grid Community v33 with the Quartz Dark theme. It connects to the proxy via WebSocket for real-time transaction updates and includes an in-browser "Run Demo" button that triggers the 3-act demo scenario directly from the UI.
* **@payguard/sdk:** Auto-generated via APIMatic from the proxy's OpenAPI spec, providing a drop-in `npm install @payguard/sdk` client for agent developers.

---

## 5. Challenges We Ran Into (150 words)

The hardest problem was designing the MCP interception layer. PayPal's MCP server uses JSON-RPC 2.0 over HTTP, not REST, so we couldn't use a standard API gateway. We had to build a protocol-aware proxy that parses the MCP tool-call schema, extracts payment-relevant fields from nested `purchase_units` structures, and reconstructs valid MCP responses — all without breaking the agent's tool-calling contract.

The second challenge was the async approval flow. When a transaction is held, the proxy must keep the MCP response pending until the human approves or rejects via Telegram — which could take seconds or minutes. We solved this with a Promise-based approval queue that holds the response and resolves it when the webhook fires, with a 5-minute timeout fallback.

---

## 6. Accomplishments We're Proud Of (100 words)

We built a fully functional agentic commerce security layer in under 48 hours that integrates directly with PayPal's existing MCP infrastructure — no modifications to PayPal's servers required. The 3-act demo (normal purchase → prompt-injected attack → phishing vendor) runs entirely in-browser and demonstrates real-time policy enforcement, human-in-the-loop approval, and live dashboard updates. We believe this is the missing security layer that PayPal's AP2 ecosystem needs before autonomous agent payments go mainstream.

---

## 7. What's Next (100 words)

1. **LLM-based prompt injection detection:** Replace heuristic rules with a reasoning-chain analyzer that inspects the agent's full context window for manipulation patterns.
2. **PayPal Disputes API integration:** Auto-generate dispute evidence dossiers when an agent-driven purchase goes wrong.
3. **Multi-agent policy profiles:** Per-agent spending limits, category restrictions, and time-of-day rules for households with multiple AI assistants.
4. **AP2 Mandate verification:** Validate cryptographic mandate signatures at the proxy layer before forwarding to PayPal.

---

## 8. Video Demonstration Script (2 min 30 sec)

| Timecode | Screen Action | Voiceover / Narration Script |
| :--- | :--- | :--- |
| **0:00–0:15** | Dashboard (empty or reset state) | *"PayPal's new MCP servers let AI agents make payments autonomously. But what happens when a malicious merchant tricks your agent into spending $400?"* |
| **0:15–0:25** | Cursor moves to and clicks **"Run 3-Act Demo"** | *"PayGuard is a drop-in security proxy that sits between your AI agent and PayPal. Let's watch it work in real time."* |
| **0:25–0:50** | **Scene 1** animates into AG Grid (Green `COMPLETED`) | *"Scene one: Sarah's shopping agent buys $12 of groceries from a trusted merchant. PayGuard's policy engine checks the amount, velocity, and vendor trust score — all clear. The transaction flows straight through to PayPal."* |
| **0:50–1:25** | **Scene 2** animates into AG Grid (Yellow `HELD`) + Phone notification | *"Scene two: a malicious merchant injects hidden instructions into their webpage, tricking the agent into authorizing a $400 premium subscription. PayGuard catches the amount threshold violation. The transaction is held. Sarah gets an instant push notification on her phone."* |
| **1:25–1:45** | User taps **Reject** on Telegram or inline in AG Grid row | *"Sarah taps Reject. The transaction is killed before it ever reaches PayPal. Her money is safe."* |
| **1:45–2:05** | **Scene 3** animates into AG Grid (Red `BLOCKED`) | *"Scene three: a known phishing vendor tries to charge $25 for a fake 'account verification fee.' PayGuard's vendor trust score blocks it instantly — no human approval needed."* |
| **2:05–2:25** | Zoom to full AG Grid console & stat cards | *"Every transaction, every policy decision, every approval — all visible in real time on the AG Grid security dashboard. This is the missing layer in agentic commerce."* |
| **2:25–2:30** | Logo + Tagline card | *"PayGuard. AP2 proves the agent signed it. We prove the agent should have."* |
