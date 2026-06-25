import { describe, it, expect } from "vitest";
import {
  CartId,
  CartOwnerId,
  CheckoutId,
  CheckoutStatus,
  GuestToken,
  ReservationId,
} from "@modules/cart/domain/value-objects";
import { DomainValidationError } from "@modules/cart/domain/errors/cart.errors";

describe("Simple Value Objects", () => {
  describe("CartId", () => {
    it("should create a CartId with a valid UUID", () => {
      const id = CartId.create();
      expect(id.getValue()).toBeDefined();
      expect(id.getValue()).toHaveLength(36);
    });

    it("should reconstruct from string", () => {
      const uuidStr = "d3b07384-d113-4956-a5d2-069d30560a6a";
      const id = CartId.fromString(uuidStr);
      expect(id.getValue()).toBe(uuidStr);
    });

    it("should check equality", () => {
      const id1 = CartId.fromString("d3b07384-d113-4956-a5d2-069d30560a6a");
      const id2 = CartId.fromString("d3b07384-d113-4956-a5d2-069d30560a6a");
      const id3 = CartId.create();

      expect(id1.equals(id2)).toBe(true);
      expect(id1.equals(id3)).toBe(false);
    });
  });

  describe("CartOwnerId", () => {
    const validUserId = "c2d48538-c73d-4ac1-a23e-abbf809cd5ef";
    const validUserId2 = "4f215025-d63e-4b9f-83cf-b71d070c7c2e";

    it("should create from user ID string", () => {
      const ownerId = CartOwnerId.fromString(validUserId);
      expect(ownerId.getValue()).toBe(validUserId);
    });

    it("should check equality", () => {
      const o1 = CartOwnerId.fromString(validUserId);
      const o2 = CartOwnerId.fromString(validUserId);
      const o3 = CartOwnerId.fromString(validUserId2);

      expect(o1.equals(o2)).toBe(true);
      expect(o1.equals(o3)).toBe(false);
    });

    it("should throw error on invalid UUID format", () => {
      expect(() => CartOwnerId.fromString("invalid-user-id")).toThrow();
    });
  });

  describe("CheckoutId", () => {
    it("should create and reconstruct CheckoutId", () => {
      const id = CheckoutId.create();
      expect(id.getValue()).toHaveLength(36);

      const reconstructed = CheckoutId.fromString(id.getValue());
      expect(reconstructed.equals(id)).toBe(true);
    });
  });

  describe("ReservationId", () => {
    it("should create and reconstruct ReservationId", () => {
      const id = ReservationId.create();
      expect(id.getValue()).toHaveLength(36);

      const reconstructed = ReservationId.fromString(id.getValue());
      expect(reconstructed.equals(id)).toBe(true);
    });
  });

  describe("GuestToken", () => {
    it("should generate a valid guest token", () => {
      const token = GuestToken.create();
      expect(token.getValue()).toBeDefined();
      expect(token.getValue()).toHaveLength(64); // 32 bytes hex is 64 chars
    });

    it("should parse and validate custom guest prefix tokens", () => {
      const customToken = GuestToken.fromString("guest_abc123");
      expect(customToken.getValue()).toBe("guest_abc123");
    });

    it("should throw on invalid guest token formats", () => {
      expect(() => GuestToken.fromString("invalid-token")).toThrow(DomainValidationError);
      expect(() => GuestToken.fromString("guest_")).toThrow(DomainValidationError);
    });

    it("should mask tokens for display", () => {
      const token = GuestToken.fromString("1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef");
      expect(token.getMasked()).toBe("1234****cdef");
    });
  });

  describe("CheckoutStatus", () => {
    it("should create from string", () => {
      const status = CheckoutStatus.fromString("pending");
      expect(status.getValue()).toBe("pending");
      expect(status.isPending()).toBe(true);
      expect(status.isCompleted()).toBe(false);
    });

    it("should throw on invalid checkout status", () => {
      expect(() => CheckoutStatus.fromString("invalid_status")).toThrow(DomainValidationError);
    });

    it("should support equality comparison", () => {
      const pending = CheckoutStatus.fromString("pending");
      const completed = CheckoutStatus.fromString("completed");
      const pending2 = CheckoutStatus.PENDING;

      expect(pending.equals(pending2)).toBe(true);
      expect(pending.equals(completed)).toBe(false);
    });
  });
});
