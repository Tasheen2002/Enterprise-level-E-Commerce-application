import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Fastify, { type FastifyInstance } from "fastify";
import Stripe from "stripe";
import rawBodyPlugin from "../../../../../apps/api/src/plugins/raw-body";
import { StripeWebhookController } from "../../../infra/http/controllers/stripe-webhook.controller";
import type { StripeConfig } from "../../../infra/config/stripe.config";

const webhookSecret = "whsec_synthetic_webhook_test_secret";
const signer = new Stripe("sk_test_synthetic_signer");
const succeeded = (id = "pi_synthetic_1") =>
  JSON.stringify({
    id: "evt_synthetic_1",
    object: "event",
    type: "payment_intent.succeeded",
    data: { object: { id } },
  });
const sign = (payload: string, secret = webhookSecret) =>
  signer.webhooks.generateTestHeaderString({ payload, secret });

let payments: {
  getPaymentIntentByClientSecret: ReturnType<typeof vi.fn>;
  authorizePayment: ReturnType<typeof vi.fn>;
  capturePayment: ReturnType<typeof vi.fn>;
  failPayment: ReturnType<typeof vi.fn>;
};
const apps: FastifyInstance[] = [];

beforeEach(() => {
  payments = {
    getPaymentIntentByClientSecret: vi.fn(async () => ({ id: "intent-1", status: "authorized" })),
    authorizePayment: vi.fn(async () => ({})),
    capturePayment: vi.fn(async () => ({})),
    failPayment: vi.fn(async () => ({})),
  };
});
afterEach(async () => {
  vi.unstubAllEnvs();
  await Promise.all(apps.splice(0).map((app) => app.close()));
});

async function webhookApp(config: StripeConfig) {
  // Mirror config into the environment so the pre-fix controller (which read
  // process.env) constructs identically; the fixed controller ignores it.
  vi.stubEnv("STRIPE_SECRET_KEY", config.secretKey);
  vi.stubEnv("STRIPE_WEBHOOK_SECRET", config.webhookSecret ?? "");
  const controller = new StripeWebhookController(payments as never, config);
  const app = Fastify();
  apps.push(app);
  await app.register(rawBodyPlugin);
  app.post("/webhook", { config: { rawBody: true } }, (request, reply) =>
    controller.handleWebhook(request as never, reply),
  );
  return app;
}

const deliver = (app: FastifyInstance, payload: string, signature?: string) =>
  app.inject({
    method: "POST",
    url: "/webhook",
    payload,
    headers: {
      "content-type": "application/json",
      ...(signature === undefined ? {} : { "stripe-signature": signature }),
    },
  });

describe("Stripe webhook authenticity", () => {
  const configured: StripeConfig = {
    secretKey: "sk_test_synthetic",
    webhookSecret,
    currency: "usd",
  };

  it("captures a payment for a correctly signed payment_intent.succeeded event", async () => {
    const app = await webhookApp(configured);
    const payload = succeeded();
    const response = await deliver(app, payload, sign(payload));
    expect(response.statusCode).toBe(200);
    expect(payments.getPaymentIntentByClientSecret).toHaveBeenCalledWith("pi_synthetic_1");
    expect(payments.capturePayment).toHaveBeenCalledWith("intent-1", "pi_synthetic_1");
  });

  it.each([
    ["a forged signature", (_payload: string) => "t=1,v1=forged"],
    ["a signature made with another secret", (payload: string) => sign(payload, "whsec_other")],
    ["a signature for different bytes", (_payload: string) => sign(succeeded("pi_other"))],
  ])("rejects %s with 400 and changes nothing", async (_label, signatureFor) => {
    const app = await webhookApp(configured);
    const payload = succeeded();
    const response = await deliver(app, payload, signatureFor(payload));
    expect(response.statusCode).toBe(400);
    expect(response.headers["www-authenticate"]).toBeUndefined();
    expect(payments.getPaymentIntentByClientSecret).not.toHaveBeenCalled();
    expect(payments.capturePayment).not.toHaveBeenCalled();
  });

  it("rejects a missing Stripe-Signature header", async () => {
    const app = await webhookApp(configured);
    expect((await deliver(app, succeeded())).statusCode).toBe(400);
    expect(payments.capturePayment).not.toHaveBeenCalled();
  });

  it("refuses all events when no signing secret is configured (fails closed)", async () => {
    const app = await webhookApp({ secretKey: "sk_test_synthetic", currency: "usd" });
    const payload = succeeded();
    for (const signature of ["anything", sign(payload)]) {
      const response = await deliver(app, payload, signature);
      expect(response.statusCode).toBe(503);
    }
    expect(payments.getPaymentIntentByClientSecret).not.toHaveBeenCalled();
    expect(payments.authorizePayment).not.toHaveBeenCalled();
    expect(payments.capturePayment).not.toHaveBeenCalled();
  });

  it("uses the injected configuration rather than ambient environment variables", async () => {
    const app = await webhookApp({ secretKey: "sk_test_synthetic", currency: "usd" });
    vi.stubEnv("STRIPE_WEBHOOK_SECRET", webhookSecret);
    const payload = succeeded();
    expect((await deliver(app, payload, sign(payload))).statusCode).toBe(503);
  });
});

describe("signed Stripe event handling", () => {
  const configured: StripeConfig = {
    secretKey: "sk_test_synthetic",
    webhookSecret,
    currency: "usd",
  };
  const event = (type: string, object: Record<string, unknown>) =>
    JSON.stringify({ id: "evt_synthetic_2", object: "event", type, data: { object } });
  const signedDelivery = async (payload: string) => {
    const app = await webhookApp(configured);
    return deliver(app, payload, sign(payload));
  };

  it("records a failed payment with Stripe's reason", async () => {
    const response = await signedDelivery(
      event("payment_intent.payment_failed", {
        id: "pi_failed",
        last_payment_error: { message: "Card declined" },
      }),
    );
    expect(response.statusCode).toBe(200);
    expect(payments.failPayment).toHaveBeenCalledWith("intent-1", "Card declined");
  });

  it("does not capture an already captured payment again", async () => {
    payments.getPaymentIntentByClientSecret.mockResolvedValueOnce({
      id: "intent-1",
      status: "captured",
    });
    const response = await signedDelivery(succeeded());
    expect(response.statusCode).toBe(200);
    expect(payments.capturePayment).not.toHaveBeenCalled();
  });

  it("acknowledges events for unknown payment intents without changing state", async () => {
    payments.getPaymentIntentByClientSecret.mockResolvedValue(null);
    expect((await signedDelivery(succeeded())).statusCode).toBe(200);
    expect(
      (await signedDelivery(event("payment_intent.payment_failed", { id: "pi_x" }))).statusCode,
    ).toBe(200);
    expect(payments.capturePayment).not.toHaveBeenCalled();
    expect(payments.failPayment).not.toHaveBeenCalled();
  });

  it.each([
    ["an event without an intent id", event("payment_intent.succeeded", {})],
    ["a refund notification", event("charge.refunded", { id: "ch_1" })],
    ["an unhandled event type", event("customer.created", { id: "cus_1" })],
  ])("acknowledges %s without touching payments", async (_label, payload) => {
    expect((await signedDelivery(payload)).statusCode).toBe(200);
    expect(payments.getPaymentIntentByClientSecret).not.toHaveBeenCalled();
  });

  it("still captures when the authorize step reports an error", async () => {
    payments.authorizePayment.mockRejectedValueOnce(new Error("already authorized"));
    expect((await signedDelivery(succeeded())).statusCode).toBe(200);
    expect(payments.capturePayment).toHaveBeenCalledWith("intent-1", "pi_synthetic_1");
  });

  it("returns a redacted server error when payment processing fails", async () => {
    payments.capturePayment.mockRejectedValueOnce(new Error("private database detail"));
    const response = await signedDelivery(succeeded());
    expect(response.statusCode).toBe(500);
    expect(response.body).not.toContain("private database detail");
  });
});

describe("Stripe webhook payload transport", () => {
  const configured: StripeConfig = {
    secretKey: "sk_test_synthetic",
    webhookSecret,
    currency: "usd",
  };

  it("rejects non-JSON payloads (Fastify parses text/plain, so the raw-body guard applies)", async () => {
    const app = await webhookApp(configured);
    const payload = succeeded();
    const response = await app.inject({
      method: "POST",
      url: "/webhook",
      payload,
      headers: { "content-type": "text/plain", "stripe-signature": sign(payload) },
    });
    expect(response.statusCode).toBe(400);
    expect(response.json().message).toBe("Webhook payload must be JSON");
    expect(payments.capturePayment).not.toHaveBeenCalled();
  });

  it("refuses to verify when the raw bytes were not captured", async () => {
    const controller = new StripeWebhookController(payments as never, configured);
    const app = Fastify();
    apps.push(app);
    // Route without the raw-body opt-in: the parsed object must never be trusted for signing.
    app.post("/unsigned-route", (request, reply) =>
      controller.handleWebhook(request as never, reply),
    );
    const payload = succeeded();
    const response = await app.inject({
      method: "POST",
      url: "/unsigned-route",
      payload,
      headers: { "content-type": "application/json", "stripe-signature": sign(payload) },
    });
    expect(response.statusCode).toBe(400);
    expect(payments.capturePayment).not.toHaveBeenCalled();
  });
});
