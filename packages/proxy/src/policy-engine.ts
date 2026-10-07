import { config } from "./config.js";
import type { PolicyResult, PolicyVerdict } from "./types.js";

// ─── Mock Vendor Trust Database ──────────────────────────────
// In production, this would query PayPal's merchant risk API
// or a third-party trust scoring service.

const VENDOR_TRUST_SCORES: Record<string, number> = {
  "legit-merchant@example.com": 95,
  "trusted-store@example.com": 88,
  "new-seller@example.com": 62,
  "sketchy-deals@example.com": 35,
  "phishing-shop@example.com": 12,
};

function getVendorTrust(vendorEmail: string): number {
  return VENDOR_TRUST_SCORES[vendorEmail] ?? 50; // default: moderate risk
}

// ─── Velocity Tracker ────────────────────────────────────────
// Sliding window per agent ID.

const agentTransactionLog = new Map<string, number[]>();

function recordTransaction(agentId: string, timestamp: number): void {
  const log = agentTransactionLog.get(agentId) ?? [];
  log.push(timestamp);
  agentTransactionLog.set(agentId, log);
}

function getRecentTransactionCount(
  agentId: string,
  now: number,
  windowMs: number
): number {
  const log = agentTransactionLog.get(agentId) ?? [];
  const cutoff = now - windowMs;
  const recent = log.filter((t) => t > cutoff);
  agentTransactionLog.set(agentId, recent); // prune old entries
  return recent.length;
}

// ─── Main Policy Engine ──────────────────────────────────────

export interface PolicyInput {
  agentId: string;
  amount: number;
  currency: string;
  vendorEmail: string;
  intent: string;
}

export function evaluatePolicy(input: PolicyInput): PolicyResult {
  const triggeredRules: string[] = [];
  let riskScore = 0;
  const now = Date.now();

  // ── Rule 1: Amount Threshold ──
  if (input.amount > config.POLICY_MAX_AMOUNT) {
    triggeredRules.push(
      `AMOUNT_THRESHOLD: $${input.amount.toFixed(2)} exceeds $${config.POLICY_MAX_AMOUNT} limit`
    );
    riskScore += 40;
  }

  // ── Rule 2: Velocity Check ──
  const recentCount = getRecentTransactionCount(
    input.agentId,
    now,
    config.POLICY_VELOCITY_WINDOW_MS
  );
  if (recentCount >= config.POLICY_VELOCITY_LIMIT) {
    triggeredRules.push(
      `VELOCITY_LIMIT: ${recentCount} transactions in ${config.POLICY_VELOCITY_WINDOW_MS / 60_000}min (limit: ${config.POLICY_VELOCITY_LIMIT})`
    );
    riskScore += 35;
  }

  // ── Rule 3: Vendor Trust Score ──
  const trustScore = getVendorTrust(input.vendorEmail);
  if (trustScore < 30) {
    triggeredRules.push(
      `CRITICAL_VENDOR_RISK: ${input.vendorEmail} scored ${trustScore}/100 (known malicious entity)`
    );
    riskScore += 75;
  } else if (trustScore < config.POLICY_MIN_VENDOR_TRUST) {
    triggeredRules.push(
      `VENDOR_TRUST: ${input.vendorEmail} scored ${trustScore}/100 (minimum: ${config.POLICY_MIN_VENDOR_TRUST})`
    );
    riskScore += 40;
  }

  // Record this transaction for future velocity checks
  recordTransaction(input.agentId, now);

  // ── Determine Verdict ──
  let verdict: PolicyVerdict;
  let reason: string;

  if (riskScore >= 70) {
    verdict = "BLOCK";
    reason = "High-risk transaction automatically blocked";
  } else if (riskScore >= 30) {
    verdict = "HOLD";
    reason = "Transaction requires human approval";
  } else {
    verdict = "ALLOW";
    reason = "All policies passed";
  }

  return {
    verdict,
    triggeredRules,
    riskScore: Math.min(riskScore, 100),
    reason,
  };
}
