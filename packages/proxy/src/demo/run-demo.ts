/**
 * PayGuard 3-Act Demo Script
 *
 * Run: pnpm demo
 *
 * This script simulates the exact 3-scene demo flow:
 *   Scene 1: Normal $12 purchase → ALLOW
 *   Scene 2: Malicious $400 charge → HOLD
 *   Scene 3: Phishing vendor $25 charge → BLOCK
 */

const PROXY_URL = "http://localhost:3100/v1/mcp";

interface DemoScenario {
  name: string;
  agentId: string;
  toolCall: {
    jsonrpc: "2.0";
    id: number;
    method: "tools/call";
    params: {
      name: string;
      arguments: Record<string, unknown>;
    };
  };
}

const scenarios: DemoScenario[] = [
  {
    name: "🟢 Scene 1: Normal grocery purchase ($12.00)",
    agentId: "sarah-shopping-agent",
    toolCall: {
      jsonrpc: "2.0",
      id: 1,
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
    name: "🟡 Scene 2: Prompt-injected $400 subscription (HOLD)",
    agentId: "sarah-shopping-agent",
    toolCall: {
      jsonrpc: "2.0",
      id: 2,
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
    name: "🔴 Scene 3: Phishing vendor $25 charge (BLOCK)",
    agentId: "sarah-shopping-agent",
    toolCall: {
      jsonrpc: "2.0",
      id: 3,
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

async function runDemo() {
  console.log("\n🛡️  PayGuard Demo — Starting\n");
  console.log("═".repeat(60));

  for (const scenario of scenarios) {
    console.log(`\n${scenario.name}`);
    console.log("─".repeat(60));

    try {
      const response = await fetch(PROXY_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Agent-Id": scenario.agentId,
        },
        body: JSON.stringify(scenario.toolCall),
      });

      const result = await response.json();
      const content = (result as any).result?.content?.[0]?.text;

      if (content) {
        const parsed = JSON.parse(content);
        console.log(`  Status:    ${parsed.status}`);
        console.log(`  Amount:    ${parsed.amount ?? "N/A"}`);
        console.log(`  Risk:      ${parsed.riskScore ?? 0}/100`);
        if (parsed.triggeredRules?.length) {
          console.log(`  Rules:     ${parsed.triggeredRules.join(", ")}`);
        }
        console.log(`  Message:   ${parsed.message}`);
      } else {
        console.log(`  Response:  ${JSON.stringify(result, null, 2)}`);
      }
    } catch (error) {
      console.error(`  ❌ Error: ${(error as Error).message}`);
    }

    // Pause between scenes for dramatic effect
    await new Promise((r) => setTimeout(r, 1500));
  }

  console.log("\n" + "═".repeat(60));
  console.log("✅ Demo complete. Check the dashboard at ws://localhost:3100/v1/ws\n");
}

runDemo();
