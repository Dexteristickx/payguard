import { z } from "zod";
import * as dotenv from "dotenv";
import path from "node:path";

dotenv.config({ path: path.resolve(process.cwd(), "../../.env") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const envSchema = z.object({
  TELEGRAM_BOT_TOKEN: z.string().optional(),
  TELEGRAM_CHAT_ID: z.string().optional(),
  PROXY_URL: z.string().default("http://localhost:3100"),
  PROXY_WS_URL: z.string().default("ws://localhost:3100/v1/ws"),
});

export const config = envSchema.parse(process.env);
export type Config = z.infer<typeof envSchema>;
