import { DomainError } from "../../../../packages/core/src/domain/domain-error";

// Stable error codes are exposed in API responses so clients can branch on
// them without parsing message strings. Codes are SCREAMING_SNAKE_CASE and
// stable across versions; messages may evolve. Previously every class in
// this file used the 2-arg `super(message, status)` form, which silently
// defaulted `code` to "DOMAIN_ERROR" — every API error in the cart module
// shared the same code, breaking client-side error branching.

// ─── Validation Errors (400) ─────────────────────────────────────────────────

export class DomainValidationError extends DomainError {
  constructor(message: string) {
    super(message, "CART_VALIDATION_ERROR", 400);
  }
}

// ─── Not Found Errors (404) ───────────────────────────────────────────────────

export class CartNotFoundError extends DomainError {
  constructor(identifier?: string) {
    super(
      identifier ? `Cart '${identifier}' not found` : "Cart not found",
      "CART_NOT_FOUND",
      404,
    );
  }
}

export class CartItemNotFoundError extends DomainError {
  constructor(variantId?: string) {
    super(
      variantId
        ? `Cart item for variant '${variantId}' not found`
        : "Cart item not found",
      "CART_ITEM_NOT_FOUND",
      404,
    );
  }
}

export class ReservationNotFoundError extends DomainError {
  constructor(identifier?: string) {
    super(
      identifier
        ? `Reservation '${identifier}' not found`
        : "Reservation not found",
      "RESERVATION_NOT_FOUND",
      404,
    );
  }
}

export class CheckoutNotFoundError extends DomainError {
  constructor(identifier?: string) {
    super(
      identifier
        ? `Checkout '${identifier}' not found`
        : "Checkout not found",
      "CHECKOUT_NOT_FOUND",
      404,
    );
  }
}

// ─── Business Rule Violations (422) ──────────────────────────────────────────

export class InvalidOperationError extends DomainError {
  constructor(message: string) {
    super(message, "INVALID_OPERATION", 422);
  }
}

export class CartOwnershipError extends DomainError {
  constructor(message: string) {
    super(message, "CART_OWNERSHIP_INVALID", 422);
  }
}

export class InvalidCartStateError extends DomainError {
  constructor(message: string) {
    super(message, "INVALID_CART_STATE", 422);
  }
}

export class InvalidCheckoutStateError extends DomainError {
  constructor(message: string) {
    super(message, "INVALID_CHECKOUT_STATE", 422);
  }
}

export class InvalidReservationOperationError extends DomainError {
  constructor(message: string) {
    super(message, "INVALID_RESERVATION_OPERATION", 422);
  }
}

export class InsufficientInventoryError extends DomainError {
  constructor(variantId: string, requested: number) {
    super(
      `Insufficient inventory for variant ${variantId} (requested ${requested})`,
      "INSUFFICIENT_INVENTORY",
      422,
    );
  }
}
