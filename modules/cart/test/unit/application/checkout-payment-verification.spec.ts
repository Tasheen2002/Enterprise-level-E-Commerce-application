import { beforeEach, describe, expect, it, vi } from "vitest";
import { CheckoutOrderService } from "../../../application/services/checkout-order.service";
import { PaymentMismatchError, PaymentNotConfirmedError } from "../../../domain/errors/cart.errors";

// Tax lookups fail in tests, so the service's 8% fallback applies:
// subtotal 10 + shipping 15 + tax 0.80 = 25.80.
vi.mock("stripe", () => ({
  default: class {
    tax = { calculations: { create: vi.fn().mockRejectedValue(new Error("offline")) } };
  },
}));

const CHECKOUT = "a11cfa10-457b-48ba-981d-5fa424f82388";
const VARIANT = "3e817d5b-b066-4434-a759-a22791fb658d";
const FULL_TOTAL = 25.8;

function fixture(
  options: {
    paid?: { succeeded: boolean; amount: number; currency?: string };
    intent?: Partial<{ checkoutId: string | null; orderId: string | null }>;
    owner?: string | null;
    promoDiscount?: number;
    loyaltyBalance?: number;
  } = {},
) {
  const intent = {
    intentId: "intent",
    status: "requires_action",
    amount: 0.01,
    provider: "stripe",
    providerReference: "pi_test",
    checkoutId: CHECKOUT,
    orderId: null,
    ...options.intent,
  };
  const port = {
    findPaymentIntent: vi.fn().mockResolvedValue(intent),
    findExistingOrder: vi.fn().mockResolvedValue(null),
    getCartEmail: vi.fn().mockResolvedValue(null),
    getUserEmail: vi.fn().mockResolvedValue(null),
    persistCheckoutOrder: vi.fn(async () => ({ orderId: "order-1", orderNo: "ORD-1" })),
  };
  const owner = options.owner === undefined ? "member" : options.owner;
  const checkout = {
    isExpired: false,
    isPending: true,
    cartId: { getValue: () => "cart" },
    cartOwnerId: owner ? { getValue: () => owner } : undefined,
    guestToken: owner ? undefined : { getValue: () => "guest" },
    currency: { getValue: () => "USD" },
  };
  const cart = {
    isEmpty: false,
    subtotal: 10,
    total: 10,
    toSnapshot: () => ({ items: [{ variantId: VARIANT, unitPriceSnapshot: 10, quantity: 1 }] }),
  };
  const variant = {
    getProductId: () => ({ getValue: () => "product" }),
    getId: () => ({ getValue: () => VARIANT }),
    getSku: () => ({ getValue: () => "SKU" }),
    getSize: () => undefined,
    getColor: () => undefined,
    getWeightG: () => undefined,
  };
  const product = {
    getId: () => ({ getValue: () => "product" }),
    getTitle: () => "Product",
    getPrice: () => ({ getValue: () => 10 }),
  };
  const loyalty = { earnPointsFromPurchase: vi.fn(), redeemPoints: vi.fn() };
  const confirmation = {
    confirm: vi.fn().mockResolvedValue({
      currency: "usd",
      ...(options.paid ?? { succeeded: true, amount: FULL_TOTAL }),
    }),
  };
  const pricing = {
    promotionDiscount: vi.fn().mockResolvedValue(options.promoDiscount ?? 0),
    loyaltyBalance: vi.fn().mockResolvedValue(options.loyaltyBalance ?? 0),
  };
  type Args = ConstructorParameters<typeof CheckoutOrderService>;
  const service = new CheckoutOrderService(
    port as unknown as Args[0],
    { findById: vi.fn().mockResolvedValue(checkout) } as unknown as Args[1],
    { findById: vi.fn().mockResolvedValue(cart) } as unknown as Args[2],
    { deleteByCartId: vi.fn() } as unknown as Args[3],
    { adjustStock: vi.fn(), findWarehouseId: vi.fn() } as unknown as Args[4],
    { findById: vi.fn().mockResolvedValue(product) } as unknown as Args[5],
    { findById: vi.fn().mockResolvedValue(variant) } as unknown as Args[6],
    { create: () => ({ toJSON: () => ({}) }) } as unknown as Args[7],
    { defaultStockLocation: "warehouse" },
    loyalty as unknown as Args[9],
    confirmation as unknown as Args[10],
    pricing as unknown as Args[11],
  );
  const dto = {
    checkoutId: CHECKOUT,
    ...(owner ? { userId: owner } : { guestToken: "guest" }),
    paymentIntentId: "intent",
    shippingAddress: {
      firstName: "Synthetic",
      lastName: "Fixture",
      addressLine1: "1 Test Road",
      city: "Test",
      country: "US",
    },
  };
  return { service, port, loyalty, pricing, dto };
}

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "log").mockImplementation(() => {});
});

const persistedTotals = (port: { persistCheckoutOrder: ReturnType<typeof vi.fn> }) =>
  (port.persistCheckoutOrder.mock.calls[0]![0] as { totals: Record<string, number> }).totals;

describe("checkout payment verification", () => {
  it("refuses an order the payment provider has not confirmed as paid", async () => {
    const h = fixture({ paid: { succeeded: false, amount: 0 } });
    await expect(h.service.completeCheckoutWithOrder(h.dto)).rejects.toBeInstanceOf(
      PaymentNotConfirmedError,
    );
    expect(h.port.persistCheckoutOrder).not.toHaveBeenCalled();
  });

  it("refuses a payment that does not cover the server-computed total", async () => {
    const h = fixture({ paid: { succeeded: true, amount: 1 } });
    await expect(h.service.completeCheckoutWithOrder(h.dto)).rejects.toBeInstanceOf(
      PaymentMismatchError,
    );
    expect(h.port.persistCheckoutOrder).not.toHaveBeenCalled();
  });

  it.each([
    ["another checkout's payment", { checkoutId: "b0000000-0000-4000-8000-000000000000" }],
    ["a payment already used for an order", { orderId: "order-0" }],
  ])("refuses %s", async (_label, intent) => {
    const h = fixture({ intent });
    await expect(h.service.completeCheckoutWithOrder(h.dto)).rejects.toBeInstanceOf(
      PaymentMismatchError,
    );
    expect(h.port.persistCheckoutOrder).not.toHaveBeenCalled();
  });

  it("refuses a payment in a different currency", async () => {
    const h = fixture({ paid: { succeeded: true, amount: 1000, currency: "eur" } });
    await expect(h.service.completeCheckoutWithOrder(h.dto)).rejects.toBeInstanceOf(
      PaymentMismatchError,
    );
  });

  it("records server-computed totals, not the amount the client chose", async () => {
    const h = fixture();
    await h.service.completeCheckoutWithOrder(h.dto);
    expect(persistedTotals(h.port)).toEqual({
      subtotal: 10,
      tax: 0.8,
      shipping: 15,
      discount: 0,
      total: FULL_TOTAL,
    });
  });

  it("applies a server-validated promotion discount", async () => {
    const h = fixture({ promoDiscount: 5, paid: { succeeded: true, amount: 20.8 } });
    await h.service.completeCheckoutWithOrder({ ...h.dto, promoCode: "SAVE5" });
    expect(persistedTotals(h.port)).toMatchObject({ discount: 5, total: 20.8 });
    expect(h.pricing.promotionDiscount).toHaveBeenCalledWith(
      expect.objectContaining({ promoCode: "SAVE5", subtotal: 10 }),
    );
  });

  it("redeems loyalty points on the server and requires enough balance", async () => {
    const short = fixture({ loyaltyBalance: 100, paid: { succeeded: true, amount: 20.8 } });
    await expect(
      short.service.completeCheckoutWithOrder({ ...short.dto, pointsToRedeem: 500 }),
    ).rejects.toThrow("Not enough loyalty points");

    const h = fixture({ loyaltyBalance: 1000, paid: { succeeded: true, amount: 20.8 } });
    await h.service.completeCheckoutWithOrder({ ...h.dto, pointsToRedeem: 500 });
    expect(persistedTotals(h.port)).toMatchObject({ discount: 5, total: 20.8 });
    expect(h.loyalty.redeemPoints).toHaveBeenCalledWith(
      expect.objectContaining({ userId: "member", points: 500, orderId: "order-1" }),
    );
  });

  it("does not let guests redeem loyalty points", async () => {
    const h = fixture({ owner: null });
    await expect(
      h.service.completeCheckoutWithOrder({ ...h.dto, guestToken: "guest", pointsToRedeem: 100 }),
    ).rejects.toThrow("signed-in customers");
  });
});
