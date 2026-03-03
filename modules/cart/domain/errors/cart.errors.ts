import { DomainError } from "@/api/src/shared/domain/domain-error";

// ─── Validation Errors (400) ─────────────────────────────────────────────────

export class DomainValidationError extends DomainError {
  constructor(message: string) {
    super(message, 400);
  }
}

// ─── Not Found Errors (404) ───────────────────────────────────────────────────

export class CartNotFoundError extends DomainError {
  constructor(identifier?: string) {
    super(
      identifier ? `Cart '${identifier}' not found` : "Cart not found",
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
      404,
    );
  }
}

// ─── Business Rule Violations (422) ──────────────────────────────────────────

export class InvalidOperationError extends DomainError {
  constructor(message: string) {
    super(message, 422);
  }
}

export class CartOwnershipError extends DomainError {
  constructor(message: string) {
    super(message, 422);
  }
}

export class InvalidCartStateError extends DomainError {
  constructor(message: string) {
    super(message, 422);
  }
}

export class InvalidCheckoutStateError extends DomainError {
  constructor(message: string) {
    super(message, 422);
  }
}

export class InvalidReservationOperationError extends DomainError {
  constructor(message: string) {
    super(message, 422);
  }
}
