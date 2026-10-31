export interface TransactionAlertData {
  id: string;
  approvalId?: string;
  agentId: string;
  amount: number;
  currency: string;
  merchant: string;
  intent: string;
  policyResult: {
    riskScore: number;
    triggeredRules: string[];
    reason: string;
  };
}

export function formatAlertMessage(data: TransactionAlertData): string {
  const rulesList = data.policyResult.triggeredRules.length
    ? data.policyResult.triggeredRules.map((r) => `  • ⚠️ \`${r}\``).join("\n")
    : "  • None";

  return `🛡️ *PAYGUARD SECURITY ALERT*
────────────────────────
🚨 *Action Required:* An AI agent attempted a transaction that violated security policies.

🤖 *Agent ID:* \`${data.agentId}\`
🏪 *Merchant:* \`${data.merchant}\`
💰 *Amount:* *$${data.amount.toFixed(2)} ${data.currency}*
🎯 *Risk Score:* *${data.policyResult.riskScore}/100*

📋 *Triggered Policies:*
${rulesList}

❓ *Authorize this payment through PayPal?*
Tap below to approve or block immediately.`;
}

export function formatDecisionMessage(
  data: TransactionAlertData,
  decision: "approved" | "rejected"
): string {
  const icon = decision === "approved" ? "✅" : "🛑";
  const actionText =
    decision === "approved"
      ? "AUTHORIZED & EXECUTED VIA PAYPAL"
      : "REJECTED & BLOCKED";

  return `${icon} *PAYGUARD TRANSACTION ${actionText}*
────────────────────────
🤖 *Agent ID:* \`${data.agentId}\`
🏪 *Merchant:* \`${data.merchant}\`
💰 *Amount:* $${data.amount.toFixed(2)} ${data.currency}
🔒 *Status:* ${decision.toUpperCase()} by user.`;
}
