import { describe, it, expect } from "vitest";
import {
  Wishlist,
  WishlistId,
  DomainValidationError,
  WishlistItemAlreadyExistsError,
  WishlistItemNotFoundError,
  WishlistCreatedEvent,
  WishlistOwnershipTransferredEvent,
  WishlistItemAddedEvent,
  WishlistItemRemovedEvent,
  WishlistClearedEvent
} from "@modules/engagement/domain";

describe("Wishlist Aggregate Root", () => {
  it("should successfully create a user wishlist and emit WishlistCreatedEvent", () => {
    const wishlist = Wishlist.create({
      userId: "user-123",
      name: "My Favorites",
      description: "Custom description"
    });

    expect(wishlist.id).toBeInstanceOf(WishlistId);
    expect(wishlist.userId).toBe("user-123");
    expect(wishlist.guestToken).toBeUndefined();
    expect(wishlist.name).toBe("My Favorites");
    expect(wishlist.description).toBe("Custom description");
    expect(wishlist.isDefault).toBe(false);
    expect(wishlist.isPublic).toBe(false);
    expect(wishlist.items).toHaveLength(0);

    const events = wishlist.domainEvents;
    expect(events).toHaveLength(1);
    expect(events[0]).toBeInstanceOf(WishlistCreatedEvent);
    expect((events[0] as WishlistCreatedEvent).userId).toBe("user-123");
  });

  it("should successfully create a guest wishlist", () => {
    const wishlist = Wishlist.create({
      guestToken: "guest-token-xyz",
      name: "Guest Wishlist"
    });

    expect(wishlist.userId).toBeUndefined();
    expect(wishlist.guestToken).toBe("guest-token-xyz");
    expect(wishlist.name).toBe("Guest Wishlist");
  });

  it("should throw DomainValidationError if neither user nor guest ownership is specified", () => {
    expect(() => {
      Wishlist.create({
        name: "Orphaned Wishlist"
      });
    }).toThrow(DomainValidationError);
  });

  it("should throw DomainValidationError if both user and guest ownership are specified simultaneously", () => {
    expect(() => {
      Wishlist.create({
        userId: "user-123",
        guestToken: "guest-token-xyz",
        name: "Dual Owned Wishlist"
      });
    }).toThrow(DomainValidationError);
  });

  it("should support updating name and description", () => {
    const wishlist = Wishlist.create({
      userId: "user-123",
      name: "Original Name"
    });

    wishlist.updateName("New Name");
    expect(wishlist.name).toBe("New Name");

    wishlist.updateDescription("New Description");
    expect(wishlist.description).toBe("New Description");

    expect(() => wishlist.updateName("   ")).toThrow(DomainValidationError);
  });

  it("should support default and publicity state mutations", () => {
    const wishlist = Wishlist.create({
      userId: "user-123",
      name: "Toggles Wishlist"
    });

    wishlist.makeDefault();
    expect(wishlist.isDefault).toBe(true);

    wishlist.removeDefault();
    expect(wishlist.isDefault).toBe(false);

    wishlist.makePublic();
    expect(wishlist.isPublic).toBe(true);

    wishlist.makePrivate();
    expect(wishlist.isPublic).toBe(false);
  });

  it("should transfer wishlist ownership from guest to user and emit WishlistOwnershipTransferredEvent", () => {
    const wishlist = Wishlist.create({
      guestToken: "guest-token-123",
      name: "Guest Wishlist"
    });

    wishlist.clearDomainEvents();
    wishlist.transferToUser("user-456");

    expect(wishlist.userId).toBe("user-456");
    expect(wishlist.guestToken).toBeUndefined();

    const events = wishlist.domainEvents;
    expect(events).toHaveLength(1);
    expect(events[0]).toBeInstanceOf(WishlistOwnershipTransferredEvent);
    expect((events[0] as WishlistOwnershipTransferredEvent).fromGuestToken).toBe("guest-token-123");
    expect((events[0] as WishlistOwnershipTransferredEvent).toUserId).toBe("user-456");
  });

  it("should support adding, removing and clearing items", () => {
    const wishlist = Wishlist.create({
      userId: "user-123",
      name: "Items Wishlist"
    });

    wishlist.clearDomainEvents();

    // Add item
    const variantId = "variant-abc";
    const item = wishlist.addItem(variantId);
    expect(wishlist.items).toHaveLength(1);
    expect(wishlist.items[0]).toBe(item);
    expect(wishlist.hasItem(variantId)).toBe(true);
    expect(wishlist.itemCount()).toBe(1);

    let events = wishlist.domainEvents;
    expect(events).toHaveLength(1);
    expect(events[0]).toBeInstanceOf(WishlistItemAddedEvent);
    expect((events[0] as WishlistItemAddedEvent).variantId).toBe(variantId);

    // Duplicate add should throw error
    expect(() => wishlist.addItem(variantId)).toThrow(WishlistItemAlreadyExistsError);

    // Remove item
    wishlist.clearDomainEvents();
    wishlist.removeItem(variantId);
    expect(wishlist.items).toHaveLength(0);
    expect(wishlist.hasItem(variantId)).toBe(false);

    events = wishlist.domainEvents;
    expect(events).toHaveLength(1);
    expect(events[0]).toBeInstanceOf(WishlistItemRemovedEvent);
    expect((events[0] as WishlistItemRemovedEvent).variantId).toBe(variantId);

    // Remove non-existent item should throw error
    expect(() => wishlist.removeItem("fake-variant")).toThrow(WishlistItemNotFoundError);

    // Clear items
    wishlist.addItem("variant-1");
    wishlist.addItem("variant-2");
    wishlist.clearDomainEvents();
    wishlist.clearItems();
    expect(wishlist.items).toHaveLength(0);

    events = wishlist.domainEvents;
    expect(events).toHaveLength(1);
    expect(events[0]).toBeInstanceOf(WishlistClearedEvent);
  });
});
