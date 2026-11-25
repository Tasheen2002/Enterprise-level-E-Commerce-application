import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Reservation } from "@modules/cart/domain/entities/reservation.entity";
import { ReservationId, CartId } from "@modules/cart/domain/value-objects";
import { DomainValidationError, InvalidReservationOperationError } from "@modules/cart/domain/errors/cart.errors";
import { ReservationCreatedEvent, ReservationExtendedEvent } from "@modules/cart/domain/entities/reservation.entity";

describe("Reservation Aggregate Root", () => {
  const cartId = "d3b07384-d113-4956-a5d2-069d30560a6a";
  const variantId = "697a8e87-bfa4-42a9-b1bc-001622adf657";
  const quantity = 3;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-24T10:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should create a Reservation successfully", () => {
    const reservation = Reservation.create({
      cartId,
      variantId,
      quantity,
    });

    expect(reservation.reservationId).toBeDefined();
    expect(reservation.cartId.getValue()).toBe(cartId);
    expect(reservation.variantId.getValue()).toBe(variantId);
    expect(reservation.quantity.getValue()).toBe(quantity);
    // Default duration is 1 minute
    expect(reservation.expiresAt).toEqual(new Date("2026-06-24T10:01:00Z"));
    expect(reservation.status).toBe("expiring_soon");
    expect(reservation.isExpired).toBe(false);

    expect(reservation.domainEvents).toHaveLength(1);
    expect(reservation.domainEvents[0]).toBeInstanceOf(ReservationCreatedEvent);
  });

  it("should support custom reservation durations", () => {
    const reservation = Reservation.create({
      cartId,
      variantId,
      quantity,
      durationMinutes: 30,
    });
    expect(reservation.expiresAt).toEqual(new Date("2026-06-24T10:30:00Z"));
  });

  it("should throw validation error if quantity is less than 1", () => {
    expect(() =>
      Reservation.create({
        cartId,
        variantId,
        quantity: 0,
      })
    ).toThrow(DomainValidationError);
  });

  it("should support updating and incrementing/decrementing quantities", () => {
    const reservation = Reservation.create({ cartId, variantId, quantity });

    reservation.incrementQuantity(2);
    expect(reservation.quantity.getValue()).toBe(5);

    reservation.decrementQuantity(2);
    expect(reservation.quantity.getValue()).toBe(3);

    // Decrementing to 0 should throw
    expect(() => reservation.decrementQuantity(3)).toThrow(InvalidReservationOperationError);
  });

  it("should evaluate expiration state correctly", () => {
    const reservation = Reservation.create({ cartId, variantId, quantity });
    expect(reservation.isExpired).toBe(false);

    // Advance time by 2 minutes (beyond the default 1)
    vi.advanceTimersByTime(2 * 60 * 1000);
    expect(reservation.isExpired).toBe(true);
  });

  it("should support extending a reservation", () => {
    const reservation = Reservation.create({ cartId, variantId, quantity });
    reservation.extend(10); // Extend by 10 minutes

    expect(reservation.expiresAt).toEqual(new Date("2026-06-24T10:11:00Z"));
    expect(reservation.domainEvents[1]).toBeInstanceOf(ReservationExtendedEvent);

    expect(() => reservation.extend(-5)).toThrow(DomainValidationError);
  });

  it("should support renewing a reservation and cap duration", () => {
    const reservation = Reservation.create({ cartId, variantId, quantity });
    reservation.renew(60); // Renew from now for 60 minutes
    expect(reservation.expiresAt).toEqual(new Date("2026-06-24T11:00:00Z"));

    // Cap duration exceeds max duration (1440 mins / 24 hours)
    expect(() => reservation.renew(2000)).toThrow(DomainValidationError);
  });

  it("should evaluate detailed status checks correctly", () => {
    const reservation = Reservation.create({ cartId, variantId, quantity, durationMinutes: 15 });

    // Active
    expect(reservation.status).toBe("active");
    expect(reservation.isExpiringSoon(5)).toBe(false);

    // Advance time by 11 minutes (4 minutes left -> expiring soon)
    vi.advanceTimersByTime(11 * 60 * 1000);
    expect(reservation.status).toBe("expiring_soon");
    expect(reservation.isExpiringSoon(5)).toBe(true);

    // Advance time by 10 minutes (expired)
    vi.advanceTimersByTime(10 * 60 * 1000);
    // Expiry was 10:15, current time is 10:21. It's expired by 6 minutes.
    // Grace period is 2 hours (120 minutes) so it's "recently_expired"
    expect(reservation.status).toBe("recently_expired");
    expect(reservation.canBeExtended).toBe(true);

    // Advance time by 3 hours (fully expired)
    vi.advanceTimersByTime(3 * 60 * 60 * 1000);
    expect(reservation.status).toBe("expired");
    expect(reservation.canBeExtended).toBe(false);
  });

  it("should evaluate cover capability and target matches", () => {
    const reservation = Reservation.create({ cartId, variantId, quantity: 5 });

    expect(reservation.isValidForCart(cartId)).toBe(true);
    expect(reservation.isValidForCart("other-cart")).toBe(false);
    expect(reservation.isValidForVariant(variantId)).toBe(true);

    expect(reservation.canCover(3)).toBe(true);
    expect(reservation.canCover(5)).toBe(true);
    expect(reservation.canCover(6)).toBe(false);

    // Expired reservation cannot cover quantity
    vi.advanceTimersByTime(20 * 60 * 1000);
    expect(reservation.canCover(3)).toBe(false);
  });
});
