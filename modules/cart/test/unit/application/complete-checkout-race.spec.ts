import { beforeEach, describe, expect, it, vi } from "vitest";
import { CheckoutOrderService } from "../../../application/services/checkout-order.service";
import { InvalidCheckoutStateError } from "../../../domain/errors/cart.errors";

// The persistence port claims the checkout atomically; a request that loses
// the claim must return the winner's order and must not repeat stock,
// reservation or loyalty side effects.
const variantId = "3e817d5b-b066-4434-a759-a22791fb658d";
const checkoutId = "a11cfa10-457b-48ba-981d-5fa424f82388";

function fixture() {
  const port = {
    findPaymentIntent: vi
      .fn()
      .mockResolvedValue({ intentId: "intent", status: "authorized", amount: 25 }),
    findExistingOrder: vi.fn().mockResolvedValue(null),
    getCartEmail: vi.fn().mockResolvedValue(null),
    getUserEmail: vi.fn().mockResolvedValue("member@example.test"),
    persistCheckoutOrder: vi.fn().mockResolvedValue({ orderId: "created-order" }),
  };
  const checkout = {
    isExpired: false,
    isPending: true,
    cartId: { getValue: () => "cart" },
    cartOwnerId: { getValue: () => "member" },
    guestToken: undefined,
    currency: { getValue: () => "USD" },
  };
  const cart = {
    isEmpty: false,
    subtotal: 10,
    total: 10,
    toSnapshot: () => ({ items: [{ variantId, unitPriceSnapshot: 10, quantity: 1 }] }),
  };
  const variant = {
    getProductId: () => ({ getValue: () => "product" }),
    getId: () => ({ getValue: () => variantId }),
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
  const stock = { adjustStock: vi.fn(), findWarehouseId: vi.fn() };
  const reservations = { deleteByCartId: vi.fn() };
  const loyalty = { earnPointsFromPurchase: vi.fn() };
  type Args = ConstructorParameters<typeof CheckoutOrderService>;
  const service = new CheckoutOrderService(
    port as unknown as Args[0],
    { findById: vi.fn().mockResolvedValue(checkout) } as unknown as Args[1],
    { findById: vi.fn().mockResolvedValue(cart) } as unknown as Args[2],
    reservations as unknown as Args[3],
    stock as unknown as Args[4],
    { findById: vi.fn().mockResolvedValue(product) } as unknown as Args[5],
    { findById: vi.fn().mockResolvedValue(variant) } as unknown as Args[6],
    { create: () => ({ toJSON: () => ({}) }) } as unknown as Args[7],
    { defaultStockLocation: "warehouse" },
    loyalty as unknown as Args[9],
    {
      confirm: vi.fn().mockResolvedValue({ succeeded: true, amount: 100, currency: "USD" }),
    } as unknown as Args[10],
    { promotionDiscount: vi.fn(), loyaltyBalance: vi.fn() } as unknown as Args[11],
  );
  const dto = {
    checkoutId,
    paymentIntentId: "intent",
    shippingAddress: {
      firstName: "Synthetic",
      lastName: "Fixture",
      addressLine1: "1 Test Road",
      city: "Test",
      postalCode: "00000",
      phone: "0000000000",
    },
  };
  return { service, port, stock, reservations, loyalty, dto };
}

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("concurrent checkout completion", () => {
  it("runs side effects once for the request that created the order", async () => {
    const h = fixture();
    await expect(h.service.completeCheckoutWithOrder(h.dto as never)).resolves.toEqual({
      orderId: "created-order",
    });
    // Stock is deducted inside the order transaction, never afterwards.
    expect(h.stock.adjustStock).not.toHaveBeenCalled();
    expect(h.reservations.deleteByCartId).toHaveBeenCalledOnce();
    expect(h.loyalty.earnPointsFromPurchase).toHaveBeenCalledOnce();
  });

  it("returns the winner's order without repeating side effects when the claim is lost", async () => {
    const h = fixture();
    const winner = { orderId: "winner-order" };
    h.port.persistCheckoutOrder.mockRejectedValueOnce(
      new InvalidCheckoutStateError("Checkout is not in pending state"),
    );
    h.port.findExistingOrder.mockResolvedValueOnce(null).mockResolvedValueOnce(winner);

    await expect(h.service.completeCheckoutWithOrder(h.dto as never)).resolves.toBe(winner);
    expect(h.port.findExistingOrder).toHaveBeenLastCalledWith(checkoutId);
    expect(h.stock.adjustStock).not.toHaveBeenCalled();
    expect(h.reservations.deleteByCartId).not.toHaveBeenCalled();
    expect(h.loyalty.earnPointsFromPurchase).not.toHaveBeenCalled();
  });

  it("propagates a lost claim when no order exists for the checkout", async () => {
    const h = fixture();
    h.port.persistCheckoutOrder.mockRejectedValueOnce(
      new InvalidCheckoutStateError("Checkout is not in pending state"),
    );
    await expect(h.service.completeCheckoutWithOrder(h.dto as never)).rejects.toBeInstanceOf(
      InvalidCheckoutStateError,
    );
    expect(h.stock.adjustStock).not.toHaveBeenCalled();
  });

  it("does not swallow unrelated persistence failures", async () => {
    const h = fixture();
    const failure = new Error("database unavailable");
    h.port.persistCheckoutOrder.mockRejectedValueOnce(failure);
    await expect(h.service.completeCheckoutWithOrder(h.dto as never)).rejects.toBe(failure);
    expect(h.port.findExistingOrder).toHaveBeenCalledOnce();
  });
});
