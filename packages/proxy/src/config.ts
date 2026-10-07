import { z } from "zod";
import * as dotenv from "dotenv";
import path from "node:path";

dotenv.config({ path: path.resolve(process.cwd(), "../../.env") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const envSchema = z.object({
  PAYPAL_CLIENT_ID: z.string().default("sandbox_client_id_placeholder"),
  PAYPAL_CLIENT_SECRET: z.string().default("sandbox_client_secret_placeholder"),
  PAYPAL_BASE_URL: z.string().url().default("https://api-m.sandbox.paypal.com"),

  PORT: z.coerce.number().default(3100),
  HOST: z.string().default("0.0.0.0"),

  POLICY_MAX_AMOUNT: z.coerce.number().default(50),
  POLICY_VELOCITY_LIMIT: z.coerce.number().default(3),
  POLICY_VELOCITY_WINDOW_MS: z.coerce.number().default(600_000), // 10 min
  POLICY_MIN_VENDOR_TRUST: z.coerce.number().default(70),

  TELEGRAM_BOT_TOKEN: z.string().optional(),
  TELEGRAM_CHAT_ID: z.string().optional(),
});

export const config = envSchema.parse(process.env);
export type Config = z.infer<typeof envSchema>;
