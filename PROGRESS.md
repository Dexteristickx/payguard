# PayGuard — Project Progress & State Tracking

## Project Goal & Scope
PayGuard is an Agentic Spending Firewall for PayPal MCP built for the PayPal AI Hackathon ("Build What's Next with PayPal and AI"). It intercepts MCP JSON-RPC payment tool calls (`create_order`, `paypal_create_order`, `capture_payment`), evaluates semantic and heuristic security policies (Amount Threshold, Velocity Limit, Vendor Trust Score), and routes high-risk transactions through a Human-in-the-Loop mobile approval flow or blocks them before hitting PayPal APIs.

## Tech Stack & Architectural Decisions
- **Runtime & Language**: Node.js (>=20) + TypeScript (ESM, `pnpm` monorepo)
- **Gateway (`@payguard/proxy`)**: Fastify v5 + `@fastify/websocket` + `@fastify/cors` + `zod`
- **Human-in-the-Loop (`@payguard/telegram-bot`)**: `grammy` Telegram Bot + WebSocket subscriber
- **Payment Rail**: PayPal Orders / Capture API v2 (with automatic fallback to sandbox simulation mode when placeholder keys are used)

## Task Checklist
- [x] Strategic research on PayPal AI stack (MCP, AP2, Fastlane) & hackathon positioning
- [x] Block 1: Scaffold monorepo and implement `@payguard/proxy` (MCP JSON-RPC interceptor, 3-rule policy engine, approval queue, PayPal forwarder)
- [x] Block 2: Implement `@payguard/telegram-bot` for real-time mobile push notifications & 1-tap inline approval/rejection
- [x] Run and verify the 3-scene automated demo (`pnpm demo`)
- [x] Block 3: Build real-time AG Grid security dashboard (`@payguard/dashboard`)
- [x] Block 4A: Devpost submission write-up (`DEVPOST.md`) with 2.5-min video script & timecodes
- [x] Block 4B: Demo video script & presentation choreography mapped
- [x] Block 4C: OpenAPI 3.0.3 spec (`/v1/openapi.json`) & `@payguard/sdk` client package scaffolded and compiled
- [ ] Block 4D: Live Telegram bot token link & recording final video

## Key Files & Recent Modifications
- `README.md`: Comprehensive open-source documentation with architecture diagram, quickstart, and sponsor details
- `DEVPOST.md`: Ready-to-submit Devpost application content with video script and timecodes
- `packages/sdk/`: Client SDK package with `PayGuardClient`, types, and `openapi.json` for APIMatic
- `packages/proxy/src/index.ts`: Added `/v1/openapi.json` spec endpoint and `/v1/demo/run` route
- `packages/dashboard/`: AG Grid Community v33 dark-mode console running on `http://localhost:5173`

## Next Immediate Action
Connect live `TELEGRAM_BOT_TOKEN` in `.env` (optional, takes 2 mins with `@BotFather`), record the 2.5-minute demo video following `DEVPOST.md`, and submit to Devpost!

