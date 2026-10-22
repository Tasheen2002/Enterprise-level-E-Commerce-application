import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CheckoutOrderService } from "../../../../modules/cart/application/services/checkout-order.service";
import { CalculateCheckoutTaxHandler } from "../../../../modules/cart/application/commands/calculate-checkout-tax.command";

const stripe = vi.hoisted(() => ({ construct: vi.fn(), calculate: vi.fn() }));
vi.mock("stripe", () => ({
  default: class {
    tax = { calculations: { create: stripe.calculate } };
    constructor(key: string, options: unknown) {
      stripe.construct(key, options);
      if (!key) throw new Error("Synthetic missing Stripe key");
    }
  },
}));

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv("STRIPE_SECRET_KEY", undefined);
  vi.spyOn(console, "error").mockImplementation(() => {});
  stripe.calculate.mockResolvedValue({ tax_amount_exclusive: 80 });
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

function fixture() {
  const stopped = new Error("Stop after tax; production persistence is outside this test");
  const port = {
    findPaymentIntent: vi
      .fn()
      .mockResolvedValue({ intentId: "synthetic-intent", status: "authorized", amount: 25.8 }),
    findExistingOrder: vi.fn().mockResolvedValue(null),
  };
  const checkout = {
    isExpired: false,
    isPending: true,
    cartId: { getValue: () => "synthetic-cart" },
    currency: { getValue: () => "EUR" },
  };
  const checkoutRepository = { findById: vi.fn().mockResolvedValue(checkout) };
  const cartRepository = {
    findById: vi.fn().mockResolvedValue({
      isEmpty: false,
      subtotal: 10,
      total: 10,
      toSnapshot: () => ({
        items: [
          { variantId: "3e817d5b-b066-4434-a759-a22791fb658d", unitPriceSnapshot: 10, quantity: 1 },
        ],
      }),
    }),
  };
  const variants = { findById: vi.fn().mockRejectedValue(stopped) };
  type Args = ConstructorParameters<typeof CheckoutOrderService>;
  const service = new CheckoutOrderService(
    port as unknown as Args[0],
    checkoutRepository as unknown as Args[1],
    cartRepository as unknown as Args[2],
    {} as Args[3],
    {} as Args[4],
    {} as Args[5],
    variants as unknown as Args[6],
    {} as Args[7],
    {},
  );
  const dto = {
    checkoutId: "a11cfa10-457b-48ba-981d-5fa424f82388",
    paymentIntentId: "synthetic-intent",
    shippingAddress: {
      firstName: "Synthetic",
      lastName: "Fixture",
      addressLine1: "1 Test Road",
      city: "Test",
      postalCode: "00000",
      country: "US",
      phone: "0000000000",
    },
  };
  return { service, port, checkoutRepository, variants, stopped, dto };
}

describe("checkout Stripe initialization boundary", () => {
  it("constructs the service without Stripe credentials or provider initialization", () => {
    expect(() => fixture()).not.toThrow();
    expect(stripe.construct).not.toHaveBeenCalled();
  });

  it("rejects an unknown checkout without constructing a provider", async () => {
    const h = fixture();
    h.checkoutRepository.findById.mockResolvedValueOnce(null);
    await expect(h.service.completeCheckoutWithOrder(h.dto)).rejects.toThrow();
    expect(stripe.construct).not.toHaveBeenCalled();
  });

  it("returns an already completed order without requiring Stripe configuration", async () => {
    const h = fixture();
    const existing = { orderId: "synthetic-existing-order" };
    h.port.findExistingOrder.mockResolvedValueOnce(existing);
    await expect(h.service.completeCheckoutWithOrder(h.dto)).resolves.toBe(existing);
    expect(stripe.construct).not.toHaveBeenCalled();
    expect(h.variants.findById).not.toHaveBeenCalled();
  });

  it("initializes Stripe only when the tax path is reached", async () => {
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_synthetic_not_a_credential");
    const h = fixture();
    expect(stripe.construct).not.toHaveBeenCalled();
    await expect(h.service.completeCheckoutWithOrder(h.dto)).rejects.toBe(h.stopped);
    expect(stripe.construct).toHaveBeenCalledOnce();
    expect(stripe.calculate).toHaveBeenCalledWith(
      expect.objectContaining({
        currency: "eur",
        line_items: [expect.objectContaining({ amount: 1000, quantity: 1 })],
      }),
    );
  });

  it("retains the existing tax-failure fallback when the SDK cannot initialize", async () => {
    const h = fixture();
    await expect(h.service.completeCheckoutWithOrder(h.dto)).rejects.toBe(h.stopped);
    expect(stripe.construct).toHaveBeenCalledOnce();
    expect(stripe.calculate).not.toHaveBeenCalled();
    expect(console.error).toHaveBeenCalledOnce();
    expect(h.variants.findById).toHaveBeenCalledOnce();
  });

  it("does not initialize Stripe for the existing country-less fallback", async () => {
    const h = fixture();
    h.dto.shippingAddress.country = "";
    await expect(h.service.completeCheckoutWithOrder(h.dto)).rejects.toBe(h.stopped);
    expect(stripe.construct).not.toHaveBeenCalled();
  });
});

describe("checkout tax handler Stripe initialization boundary", () => {
  function taxFixture() {
    const base = fixture();
    const checkout = {
      cartId: { getValue: () => "91d5d662-e1d3-4514-a2fd-0c4504238171" },
      currency: { getValue: () => "EUR" },
      updateTotalAmount: vi.fn(),
    };
    const checkoutRepository = { findById: vi.fn().mockResolvedValue(checkout), save: vi.fn() };
    const cartRepository = {
      findById: vi.fn().mockResolvedValue({
        subtotal: 10,
        total: 10,
        toSnapshot: () => ({ items: [{ unitPriceSnapshot: 10, quantity: 1 }] }),
      }),
    };
    type Args = ConstructorParameters<typeof CalculateCheckoutTaxHandler>;
    const handler = new CalculateCheckoutTaxHandler(
      checkoutRepository as unknown as Args[0],
      cartRepository as unknown as Args[1],
    );
    return { handler, checkout, checkoutRepository, cartRepository, command: base.dto };
  }

  it("constructs without Stripe configuration", () => {
    expect(() => taxFixture()).not.toThrow();
    expect(stripe.construct).not.toHaveBeenCalled();
  });

  it("validates a missing checkout before provider initialization", async () => {
    const h = taxFixture();
    h.checkoutRepository.findById.mockResolvedValueOnce(null);
    await expect(h.handler.handle(h.command)).rejects.toThrow();
    expect(stripe.construct).not.toHaveBeenCalled();
  });

  it("defers configured provider initialization until tax is requested", async () => {
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_synthetic_not_a_credential");
    const h = taxFixture();
    expect(stripe.construct).not.toHaveBeenCalled();
    await h.handler.handle(h.command);
    expect(stripe.construct).toHaveBeenCalledOnce();
    expect(stripe.calculate).toHaveBeenCalledWith(expect.objectContaining({ currency: "eur" }));
    expect(h.checkout.updateTotalAmount).toHaveBeenCalledWith(25.8);
    expect(h.checkoutRepository.save).toHaveBeenCalledWith(h.checkout);
  });

  it("retains the existing simulated fallback if Stripe cannot initialize", async () => {
    const h = taxFixture();
    await h.handler.handle(h.command);
    expect(stripe.construct).toHaveBeenCalledOnce();
    expect(stripe.calculate).not.toHaveBeenCalled();
    expect(h.checkout.updateTotalAmount).toHaveBeenCalledWith(25.8);
    expect(h.checkoutRepository.save).toHaveBeenCalledWith(h.checkout);
  });

  it("keeps the existing country-less fallback free of provider setup", async () => {
    const h = taxFixture();
    h.command.shippingAddress.country = "";
    await h.handler.handle(h.command);
    expect(stripe.construct).not.toHaveBeenCalled();
    expect(h.checkout.updateTotalAmount).toHaveBeenCalledWith(25.8);
  });
});
