import { describe, it, expect } from "vitest";
import { CartItem } from "@modules/cart/domain/entities/cart-item.entity";
import { DomainValidationError, InvalidOperationError } from "@modules/cart/domain/errors/cart.errors";

describe("CartItem Entity", () => {
  const defaultItemData = {
    cartId: "cart-123",
    variantId: "697a8e87-bfa4-42a9-b1bc-001622adf657",
    quantity: 2,
    unitPrice: 100,
  };

  it("should create a CartItem successfully", () => {
    const item = CartItem.create(defaultItemData);
    expect(item.id).toBeDefined();
    expect(item.cartId).toBe("cart-123");
    expect(item.variantId.getValue()).toBe(defaultItemData.variantId);
    expect(item.quantity.getValue()).toBe(2);
    expect(item.unitPrice).toBe(100);
    expect(item.isGift).toBe(false);
    expect(item.giftMessage).toBeUndefined();
    expect(item.subtotal).toBe(200);
    expect(item.discountAmount).toBe(0);
    expect(item.totalPrice).toBe(200);
  });

  it("should throw validation error if unit price is negative", () => {
    expect(() =>
      CartItem.create({
        ...defaultItemData,
        unitPrice: -5,
      })
    ).toThrow(DomainValidationError);
  });

  it("should throw validation error if gift item is created without a message", () => {
    expect(() =>
      CartItem.create({
        ...defaultItemData,
        isGift: true,
      })
    ).toThrow(DomainValidationError);

    expect(() =>
      CartItem.create({
        ...defaultItemData,
        isGift: true,
        giftMessage: "   ",
      })
    ).toThrow("Gift message is required for gift items");
  });

  it("should support incrementing and decrementing quantity", () => {
    const item = CartItem.create(defaultItemData);
    item.incrementQuantity(3);
    expect(item.quantity.getValue()).toBe(5);

    item.decrementQuantity(2);
    expect(item.quantity.getValue()).toBe(3);
  });

  it("should support marking/unmarking as gift with messages", () => {
    const item = CartItem.create(defaultItemData);

    item.markAsGift("Happy Birthday!");
    expect(item.isGift).toBe(true);
    expect(item.giftMessage).toBe("Happy Birthday!");

    item.updateGiftMessage("Merry Christmas!");
    expect(item.giftMessage).toBe("Merry Christmas!");

    item.unmarkAsGift();
    expect(item.isGift).toBe(false);
    expect(item.giftMessage).toBeUndefined();
  });

  it("should throw error if updating gift message on a non-gift item", () => {
    const item = CartItem.create(defaultItemData);
    expect(() => item.updateGiftMessage("Some Message")).toThrow(InvalidOperationError);
  });

  it("should calculate correct discounts with percentage and fixed promos", () => {
    const item = CartItem.create({
      ...defaultItemData,
      appliedPromos: [
        {
          id: "p-1",
          code: "PERCENT10",
          type: "percentage",
          value: 10, // 10% off
          appliedAt: new Date(),
        },
        {
          id: "p-2",
          code: "FIXED20",
          type: "fixed_amount",
          value: 20, // $20 off
          appliedAt: new Date(),
        },
      ],
    });

    // Subtotal: 2 * 100 = 200
    // Percentage discount: 200 * 0.1 = 20
    // Fixed discount: 20
    // Total discount: 20 + 20 = 40
    // Total price: 200 - 40 = 160
    expect(item.subtotal).toBe(200);
    expect(item.discountAmount).toBe(40);
    expect(item.totalPrice).toBe(160);
  });

  it("should cap total discount at the subtotal amount", () => {
    const item = CartItem.create({
      ...defaultItemData,
      appliedPromos: [
        {
          id: "p-huge",
          code: "BIGFIXED",
          type: "fixed_amount",
          value: 500, // exceeds subtotal of 200
          appliedAt: new Date(),
        },
      ],
    });

    expect(item.subtotal).toBe(200);
    expect(item.discountAmount).toBe(200);
    expect(item.totalPrice).toBe(0);
  });

  it("should support adding/removing promos dynamically", () => {
    const item = CartItem.create(defaultItemData);
    expect(item.hasPromosApplied).toBe(false);

    item.addPromo({
      id: "p-1",
      code: "PERCENT10",
      type: "percentage",
      value: 10,
      appliedAt: new Date(),
    });

    expect(item.hasPromosApplied).toBe(true);
    expect(item.discountAmount).toBe(20); // 10% of 200

    item.removePromo("p-1");
    expect(item.hasPromosApplied).toBe(false);
    expect(item.discountAmount).toBe(0);
  });

  it("should correctly support snapshots and DTO conversions", () => {
    const item = CartItem.create(defaultItemData);
    const snapshot = item.toSnapshot();

    expect(snapshot.quantity).toBe(2);
    expect(snapshot.unitPriceSnapshot).toBe(100);

    const dto = CartItem.toDTO(item);
    expect(dto.subtotal).toBe(200);
    expect(dto.totalPrice).toBe(200);
  });
});
