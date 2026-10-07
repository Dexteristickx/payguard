import { config } from "./config.js";
import type { PayPalCreateOrderRequest, PayPalOrderResponse } from "./types.js";
import { randomUUID } from "node:crypto";

// ─── OAuth2 Token Cache ──────────────────────────────────────

let cachedToken: string | null = null;
let tokenExpiry = 0;

async function getAccessToken(): Promise<string> {
  // If running with placeholder credentials, return mock token
  if (
    !config.PAYPAL_CLIENT_ID ||
    config.PAYPAL_CLIENT_ID === "sandbox_client_id_placeholder" ||
    config.PAYPAL_CLIENT_ID.startsWith("your_")
  ) {
    return "mock_sandbox_access_token";
  }

  if (cachedToken && Date.now() < tokenExpiry) {
    return cachedToken;
  }

  const credentials = Buffer.from(
    `${config.PAYPAL_CLIENT_ID}:${config.PAYPAL_CLIENT_SECRET}`
  ).toString("base64");

  const response = await fetch(`${config.PAYPAL_BASE_URL}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`PayPal OAuth failed: ${response.status} ${error}`);
  }

  const data = (await response.json()) as {
    access_token: string;
    expires_in: number;
  };

  cachedToken = data.access_token;
  tokenExpiry = Date.now() + (data.expires_in - 60) * 1000; // refresh 60s early

  return cachedToken;
}

// ─── Create Order ────────────────────────────────────────────

export async function createPayPalOrder(
  orderRequest: PayPalCreateOrderRequest
): Promise<PayPalOrderResponse> {
  const token = await getAccessToken();

  if (token === "mock_sandbox_access_token") {
    // Simulated sandbox response for local development & offline demo
    return {
      id: `ORDER-MOCK-${randomUUID().slice(0, 8).toUpperCase()}`,
      status: "CREATED",
      links: [
        {
          href: "https://www.sandbox.paypal.com/checkoutnow?token=mock",
          rel: "approve",
          method: "GET",
        },
      ],
    };
  }

  const response = await fetch(
    `${config.PAYPAL_BASE_URL}/v2/checkout/orders`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "PayPal-Request-Id": randomUUID(),
      },
      body: JSON.stringify(orderRequest),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`PayPal Orders API failed: ${response.status} ${error}`);
  }

  return (await response.json()) as PayPalOrderResponse;
}

// ─── Capture Order (Post-Approval) ──────────────────────────

export async function capturePayPalOrder(
  orderId: string
): Promise<unknown> {
  const token = await getAccessToken();

  if (token === "mock_sandbox_access_token") {
    return {
      id: orderId,
      status: "COMPLETED",
      details: "Simulated PayPal Capture in sandbox simulation mode",
    };
  }

  const response = await fetch(
    `${config.PAYPAL_BASE_URL}/v2/checkout/orders/${orderId}/capture`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`PayPal Capture failed: ${response.status} ${error}`);
  }

  return response.json();
}
