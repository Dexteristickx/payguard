import { Bot, InlineKeyboard } from "grammy";
import WebSocket from "ws";
import { config } from "./config.js";
import {
  formatAlertMessage,
  formatDecisionMessage,
  type TransactionAlertData,
} from "./alert-formatter.js";

async function main() {
  console.log("\n🤖 PayGuard Telegram Human-in-the-Loop Gateway\n" + "═".repeat(50));

  if (!config.TELEGRAM_BOT_TOKEN) {
    console.warn(
      "\n⚠️  TELEGRAM_BOT_TOKEN is not set in .env." +
        "\n👉 To connect live Telegram push notifications:" +
        "\n   1. Open Telegram and search for @BotFather" +
        "\n   2. Send /newbot and copy the HTTP API token" +
        "\n   3. Add TELEGRAM_BOT_TOKEN=your_token to your .env" +
        "\n   4. Run the bot and message it /start to get your CHAT_ID\n"
    );
  }

  let bot: Bot | null = null;
  const activeAlerts = new Map<string, TransactionAlertData>();

  if (config.TELEGRAM_BOT_TOKEN) {
    bot = new Bot(config.TELEGRAM_BOT_TOKEN);

    // ── Command: /start ──
    bot.command("start", async (ctx) => {
      const chatId = ctx.chat.id;
      await ctx.reply(
        `🛡️ *Welcome to PayGuard Security Bot*\n\n` +
          `Your Telegram Chat ID is: \`${chatId}\`\n\n` +
          `Copy this into your \`.env\` as:\n` +
          `\`TELEGRAM_CHAT_ID=${chatId}\`\n\n` +
          `Whenever an AI agent triggers a policy violation, you'll receive a real-time alert here with 1-tap Approve/Reject buttons.`,
        { parse_mode: "Markdown" }
      );
    });

    // ── Handle Inline Button Clicks ──
    bot.callbackQuery(/^(approve|reject):(.+)$/, async (ctx) => {
      const decision = ctx.match[1] as "approve" | "reject";
      const approvalId = ctx.match[2];

      await ctx.answerCallbackQuery({
        text: `Processing ${decision.toUpperCase()}...`,
      });

      try {
        const response = await fetch(
          `${config.PROXY_URL}/v1/approvals/${approvalId}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ decision }),
          }
        );

        if (!response.ok) {
          await ctx.reply(`❌ Failed to resolve approval: ${response.statusText}`);
          return;
        }

        const alertData = activeAlerts.get(approvalId);
        if (alertData && ctx.callbackQuery.message) {
          await ctx.editMessageText(
            formatDecisionMessage(alertData, decision === "approve" ? "approved" : "rejected"),
            { parse_mode: "Markdown" }
          );
        } else {
          await ctx.reply(`✅ Transaction ${decision.toUpperCase()} successfully.`);
        }
      } catch (err) {
        console.error("Error resolving approval via proxy:", err);
        await ctx.reply(`❌ Network error contacting PayGuard Proxy.`);
      }
    });

    // Start bot polling
    bot.start({
      onStart: (info) => {
        console.log(`✅ Telegram bot connected as @${info.username}`);
      },
    });
  }

  // ── WebSocket Listener for Proxy Events ──
  function connectWs() {
    console.log(`🔌 Connecting to PayGuard WebSocket: ${config.PROXY_WS_URL}`);
    const ws = new WebSocket(config.PROXY_WS_URL);

    ws.on("open", () => {
      console.log("📡 Connected to PayGuard real-time event feed.");
    });

    ws.on("message", async (data: WebSocket.RawData) => {
      try {
        const event = JSON.parse(data.toString());

        if (event.type === "APPROVAL_REQUESTED") {
          const tx: TransactionAlertData = event.data;
          const approvalId = tx.approvalId;
          if (!approvalId) return;

          activeAlerts.set(approvalId, tx);
          console.log(`\n🚨 APPROVAL REQUESTED for tx: ${tx.id} ($${tx.amount})`);

          if (bot && config.TELEGRAM_CHAT_ID) {
            const keyboard = new InlineKeyboard()
              .text("✅ Approve ($" + tx.amount.toFixed(2) + ")", `approve:${approvalId}`)
              .text("❌ Reject & Block", `reject:${approvalId}`);

            await bot.api.sendMessage(
              config.TELEGRAM_CHAT_ID,
              formatAlertMessage(tx),
              {
                parse_mode: "Markdown",
                reply_markup: keyboard,
              }
            );
            console.log(`📲 Notification sent to Telegram chat: ${config.TELEGRAM_CHAT_ID}`);
          } else {
            console.log(
              `ℹ️  [Mock Push] Transaction held: ID=${tx.id}, ApprovalID=${approvalId}.` +
                `\n   Resolve via curl: POST http://localhost:3100/v1/approvals/${approvalId} with {"decision":"approve"|"reject"}`
            );
          }
        }
      } catch (err) {
        console.error("Error parsing WebSocket event:", err);
      }
    });

    ws.on("close", () => {
      console.warn("⚠️ WebSocket disconnected. Reconnecting in 3s...");
      setTimeout(connectWs, 3000);
    });

    ws.on("error", (err) => {
      console.error("WebSocket error:", err.message);
    });
  }

  connectWs();
}

main().catch(console.error);
