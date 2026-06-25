import { describe, it, expect } from "vitest";
import { ShoppingCart } from "@modules/cart/domain/entities/shopping-cart.entity";
import { CartId, CartOwnerId, GuestToken } from "@modules/cart/domain/value-objects";
import { DomainValidationError, InvalidOperationError, CartItemNotFoundError } from "@modules/cart/domain/errors/cart.errors";
import {
  CartCreatedEvent,
  CartItemAddedEvent,
  CartItemQuantityChangedEvent,
  CartItemRemovedEvent,
  CartClearedEvent,
  CartEmailUpdatedEvent,
  CartShippingInfoUpdatedEvent,
  CartAddressesUpdatedEvent,
  CartTransferredToUserEvent,
} from "@modules/cart/domain/entities/shopping-cart.entity";

describe("ShoppingCart Aggregate Root", () => {
  const currency = "USD";
  const guestTokenStr = "guest_abc123123123123123123123123";
  const userIdStr = "c2d48538-c73d-4ac1-a23e-abbf809cd5ef";
  const variantId = "697a8e87-bfa4-42a9-b1bc-001622adf657";

  describe("Creation Invariants", () => {
    it("should successfully create a user cart", () => {
      const cart = ShoppingCart.createForUser({ userId: userIdStr, currency });
      expect(cart.isUserCart).toBe(true);
      expect(cart.isGuestCart).toBe(false);
      expect(cart.cartOwnerId?.getValue()).toBe(userIdStr);
      expect(cart.guestToken).toBeNull();
      expect(cart.currency.getValue()).toBe("USD");
      expect(cart.isEmpty).toBe(true);

      const events = cart.domainEvents;
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(CartCreatedEvent);
      expect(events[0].getPayload().isGuestCart).toBe(false);
    });

    it("should successfully create a guest cart", () => {
      const cart = ShoppingCart.createForGuest({ guestToken: guestTokenStr, currency });
      expect(cart.isGuestCart).toBe(true);
      expect(cart.isUserCart).toBe(false);
      expect(cart.guestToken?.getValue()).toBe(guestTokenStr);
      expect(cart.cartOwnerId).toBeNull();

      const events = cart.domainEvents;
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(CartCreatedEvent);
      expect(events[0].getPayload().isGuestCart).toBe(true);
    });

    it("should throw validation error if ownership is invalid", () => {
      // Must throw if neither user nor guest is specified
      expect(() =>
        ShoppingCart.create({
          currency,
        } as any)
      ).toThrow();
    });
  });

  describe("Item Management", () => {
    it("should support adding a new item to the cart", () => {
      const cart = ShoppingCart.createForUser({ userId: userIdStr, currency });
      cart.addItem({
        variantId,
        quantity: 2,
        unitPrice: 50,
      });

      expect(cart.isEmpty).toBe(false);
      expect(cart.uniqueItemCount).toBe(1);
      expect(cart.itemCount).toBe(2);
      expect(cart.subtotal).toBe(100);

      const events = cart.domainEvents;
      // 1: CartCreated, 2: CartItemAdded
      expect(events).toHaveLength(2);
      expect(events[1]).toBeInstanceOf(CartItemAddedEvent);
    });

    it("should combine quantities when adding an existing item", () => {
      const cart = ShoppingCart.createForUser({ userId: userIdStr, currency });
      cart.addItem({ variantId, quantity: 2, unitPrice: 50 });
      cart.addItem({ variantId, quantity: 3, unitPrice: 50 });

      expect(cart.uniqueItemCount).toBe(1);
      expect(cart.itemCount).toBe(5);
      expect(cart.subtotal).toBe(250);

      const events = cart.domainEvents;
      // 1: CartCreated
      // 2: CartItemAdded (first add)
      // 3: CartItemQuantityChanged (second add existing)
      // 4: CartItemAdded (second add end)
      expect(events).toHaveLength(4);
      expect(events[2]).toBeInstanceOf(CartItemQuantityChangedEvent);
      expect(events[3]).toBeInstanceOf(CartItemAddedEvent);
    });

    it("should support updating item quantity", () => {
      const cart = ShoppingCart.createForUser({ userId: userIdStr, currency });
      cart.addItem({ variantId, quantity: 2, unitPrice: 50 });

      cart.updateItemQuantity(variantId, 4);
      expect(cart.itemCount).toBe(4);

      // Updating quantity to 0 should remove the item
      cart.updateItemQuantity(variantId, 0);
      expect(cart.isEmpty).toBe(true);
    });

    it("should throw error when updating quantity for an item not in cart", () => {
      const cart = ShoppingCart.createForUser({ userId: userIdStr, currency });
      expect(() => cart.updateItemQuantity(variantId, 2)).toThrow(CartItemNotFoundError);
    });

    it("should support removing an item", () => {
      const cart = ShoppingCart.createForUser({ userId: userIdStr, currency });
      cart.addItem({ variantId, quantity: 2, unitPrice: 50 });

      cart.removeItem(variantId);
      expect(cart.isEmpty).toBe(true);
      expect(cart.domainEvents[2]).toBeInstanceOf(CartItemRemovedEvent);
    });

    it("should support clearing all items", () => {
      const cart = ShoppingCart.createForUser({ userId: userIdStr, currency });
      cart.addItem({ variantId, quantity: 2, unitPrice: 50 });
      const variantId2 = "4bb6b1e2-ad25-4d11-86b1-152f7fdd3ab2";
      cart.addItem({ variantId: variantId2, quantity: 1, unitPrice: 100 });

      cart.clearItems();
      expect(cart.isEmpty).toBe(true);
      expect(cart.domainEvents[cart.domainEvents.length - 1]).toBeInstanceOf(CartClearedEvent);
    });
  });

  describe("Calculations, Shipping, and Gifts", () => {
    it("should calculate correct totals with discount promos", () => {
      const cart = ShoppingCart.createForUser({ userId: userIdStr, currency });
      cart.addItem({
        variantId,
        quantity: 2,
        unitPrice: 100,
        appliedPromos: [
          {
            id: "promo-1",
            code: "TENOFF",
            type: "percentage",
            value: 10,
            appliedAt: new Date(),
          },
        ],
      });

      expect(cart.subtotal).toBe(200);
      expect(cart.totalDiscount).toBe(20);
      expect(cart.total).toBe(180);
    });

    it("should evaluate free shipping status", () => {
      const cart = ShoppingCart.createForUser({ userId: userIdStr, currency });
      cart.addItem({ variantId, quantity: 1, unitPrice: 100 });
      expect(cart.hasFreeShipping).toBe(false);

      // Add item with free shipping promo
      const variantId2 = "4bb6b1e2-ad25-4d11-86b1-152f7fdd3ab2";
      cart.addItem({
        variantId: variantId2,
        quantity: 1,
        unitPrice: 50,
        appliedPromos: [
          {
            id: "promo-ship",
            code: "FREESHIP",
            type: "free_shipping",
            value: 0,
            appliedAt: new Date(),
          },
        ],
      });

      expect(cart.hasFreeShipping).toBe(true);
      expect(cart.itemsRequiringShipping).toHaveLength(1);
    });

    it("should identify gift items", () => {
      const cart = ShoppingCart.createForUser({ userId: userIdStr, currency });
      cart.addItem({ variantId, quantity: 1, unitPrice: 100 });
      expect(cart.hasGiftItems).toBe(false);

      const variantIdGift = "e7b0a8f8-b39d-4775-87a4-0ef6d3d4b6cb";
      cart.addItem({
        variantId: variantIdGift,
        quantity: 1,
        unitPrice: 10,
        isGift: true,
        giftMessage: "Happy Birthday!",
      });

      expect(cart.hasGiftItems).toBe(true);
      expect(cart.giftItems).toHaveLength(1);
    });
  });

  describe("Pre-checkout and Address mutations", () => {
    it("should support email updates", () => {
      const cart = ShoppingCart.createForUser({ userId: userIdStr, currency });
      cart.updateEmail("shopper@example.com");

      expect(cart.email).toBe("shopper@example.com");
      expect(cart.domainEvents[1]).toBeInstanceOf(CartEmailUpdatedEvent);
    });

    it("should support shipping info updates", () => {
      const cart = ShoppingCart.createForUser({ userId: userIdStr, currency });
      cart.updateShippingInfo({
        shippingMethod: "FEDEX",
        shippingOption: "PRIORITY",
        isGift: true,
      });

      expect(cart.shippingMethod).toBe("FEDEX");
      expect(cart.shippingOption).toBe("PRIORITY");
      expect(cart.isGiftCart).toBe(true);
      expect(cart.domainEvents[1]).toBeInstanceOf(CartShippingInfoUpdatedEvent);
    });

    it("should support patch-style address updates", () => {
      const cart = ShoppingCart.createForUser({ userId: userIdStr, currency });
      cart.updateAddresses({
        shippingFirstName: "John",
        shippingLastName: "Doe",
        shippingAddress1: "123 Main St",
        shippingCity: "New York",
        shippingPostalCode: "10001",
        shippingCountryCode: "US",
        sameAddressForBilling: false,
        billingFirstName: "Jane",
        billingAddress1: "456 Billing Ave",
      });

      expect(cart.shippingFirstName).toBe("John");
      expect(cart.shippingLastName).toBe("Doe");
      expect(cart.shippingAddress1).toBe("123 Main St");
      expect(cart.sameAddressForBilling).toBe(false);
      expect(cart.billingFirstName).toBe("Jane");
      expect(cart.billingAddress1).toBe("456 Billing Ave");
      expect(cart.domainEvents[1]).toBeInstanceOf(CartAddressesUpdatedEvent);
    });
  });

  describe("Guest-to-User Transfer and Cart Merging", () => {
    it("should transfer ownership from guest to user successfully", () => {
      const cart = ShoppingCart.createForGuest({ guestToken: guestTokenStr, currency });
      expect(cart.isGuestCart).toBe(true);

      const targetUserId = "4f215025-d63e-4b9f-83cf-b71d070c7c2e";
      const transferred = cart.transferToUser(targetUserId);
      expect(transferred.isUserCart).toBe(true);
      expect(transferred.cartOwnerId?.getValue()).toBe(targetUserId);
      expect(transferred.guestToken).toBeNull();
      // The new returned transferredCart starts fresh with just the Transfer event
      expect(transferred.domainEvents).toHaveLength(1);
      expect(transferred.domainEvents[0]).toBeInstanceOf(CartTransferredToUserEvent);
    });

    it("should throw error if attempting to transfer an already user cart", () => {
      const cart = ShoppingCart.createForUser({ userId: userIdStr, currency });
      expect(() => cart.transferToUser("4f215025-d63e-4b9f-83cf-b71d070c7c2e")).toThrow(InvalidOperationError);
      expect(() => cart.transferToUser("4f215025-d63e-4b9f-83cf-b71d070c7c2e")).toThrow("Cannot transfer user cart to another user");
    });

    it("should merge items into a user cart correctly", () => {
      const userCart = ShoppingCart.createForUser({ userId: userIdStr, currency });
      const variantId1 = "1caf0dfd-c10a-447f-987a-bbff2132c1ee";
      const variantId2 = "4bb6b1e2-ad25-4d11-86b1-152f7fdd3ab2";
      const variantId3 = "697a8e87-bfa4-42a9-b1bc-001622adf657";

      userCart.addItem({ variantId: variantId1, quantity: 2, unitPrice: 10 });
      userCart.addItem({ variantId: variantId2, quantity: 1, unitPrice: 20 });

      const guestCart = ShoppingCart.createForGuest({ guestToken: guestTokenStr, currency });
      guestCart.addItem({ variantId: variantId2, quantity: 3, unitPrice: 20 });
      guestCart.addItem({ variantId: variantId3, quantity: 5, unitPrice: 30 });

      // Merge guest cart into user cart
      userCart.mergeWith(guestCart);

      expect(userCart.uniqueItemCount).toBe(3);
      expect(userCart.findItemByVariantId(variantId1)?.quantity.getValue()).toBe(2);
      expect(userCart.findItemByVariantId(variantId2)?.quantity.getValue()).toBe(4); // 1 + 3
      expect(userCart.findItemByVariantId(variantId3)?.quantity.getValue()).toBe(5);
    });

    it("should throw error if attempting to merge into a guest cart", () => {
      const guestCart1 = ShoppingCart.createForGuest({ guestToken: guestTokenStr, currency });
      const guestCart2 = ShoppingCart.createForGuest({ guestToken: "guest_2", currency });

      expect(() => guestCart1.mergeWith(guestCart2)).toThrow(InvalidOperationError);
      expect(() => guestCart1.mergeWith(guestCart2)).toThrow("Can only merge into user cart");
    });
  });
});
