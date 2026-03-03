import { DomainError } from "@/api/src/shared/domain/domain-error";

// ─── Validation Errors (400) ──────────────────────────────────────────────────

export class DomainValidationError extends DomainError {
  constructor(message: string) {
    super(message, 400);
  }
}

// ─── Not Found Errors (404) ───────────────────────────────────────────────────

export class PaymentIntentNotFoundError extends DomainError {
  constructor(identifier?: string) {
    super(
      identifier
        ? `Payment intent '${identifier}' not found`
        : "Payment intent not found",
      404,
    );
  }
}

export class PaymentTransactionNotFoundError extends DomainError {
  constructor(identifier?: string) {
    super(
      identifier
        ? `Payment transaction '${identifier}' not found`
        : "Payment transaction not found",
      404,
    );
  }
}

export class GiftCardNotFoundError extends DomainError {
  constructor(identifier?: string) {
    super(
      identifier
        ? `Gift card '${identifier}' not found`
        : "Gift card not found",
      404,
    );
  }
}

export class BnplTransactionNotFoundError extends DomainError {
  constructor(identifier?: string) {
    super(
      identifier
        ? `BNPL transaction '${identifier}' not found`
        : "BNPL transaction not found",
      404,
    );
  }
}

export class LoyaltyAccountNotFoundError extends DomainError {
  constructor(identifier?: string) {
    super(
      identifier
        ? `Loyalty account '${identifier}' not found`
        : "Loyalty account not found",
      404,
    );
  }
}

export class LoyaltyProgramNotFoundError extends DomainError {
  constructor(identifier?: string) {
    super(
      identifier
        ? `Loyalty program '${identifier}' not found`
        : "Loyalty program not found",
      404,
    );
  }
}

export class PromotionNotFoundError extends DomainError {
  constructor(identifier?: string) {
    super(
      identifier
        ? `Promotion '${identifier}' not found`
        : "Promotion not found",
      404,
    );
  }
}

export class WebhookEventNotFoundError extends DomainError {
  constructor(identifier?: string) {
    super(
      identifier
        ? `Webhook event '${identifier}' not found`
        : "Webhook event not found",
      404,
    );
  }
}

// ─── Conflict Errors (409) ────────────────────────────────────────────────────

export class LoyaltyAccountAlreadyExistsError extends DomainError {
  constructor(userId: string, programId: string) {
    super(
      `Loyalty account already exists for user '${userId}' in program '${programId}'`,
      409,
    );
  }
}

export class GiftCardCodeAlreadyExistsError extends DomainError {
  constructor(code: string) {
    super(`Gift card with code '${code}' already exists`, 409);
  }
}

// ─── Business Rule Violations (422) ──────────────────────────────────────────

export class InvalidOperationError extends DomainError {
  constructor(message: string) {
    super(message, 422);
  }
}

export class PaymentIntentInvalidStatusError extends DomainError {
  constructor(operation: string, currentStatus: string) {
    super(
      `Cannot ${operation} payment intent with status '${currentStatus}'`,
      422,
    );
  }
}

export class PaymentIntentNotLinkedToOrderError extends DomainError {
  constructor() {
    super("Payment intent is not linked to an order", 422);
  }
}

export class GiftCardRedemptionError extends DomainError {
  constructor(reason: string) {
    super(`Cannot redeem gift card: ${reason}`, 422);
  }
}

export class GiftCardRefundError extends DomainError {
  constructor(reason: string) {
    super(`Cannot refund gift card: ${reason}`, 422);
  }
}

export class GiftCardCancellationError extends DomainError {
  constructor(reason: string) {
    super(`Cannot cancel gift card: ${reason}`, 422);
  }
}

export class GiftCardExpiryError extends DomainError {
  constructor(reason: string) {
    super(`Gift card expiry error: ${reason}`, 422);
  }
}

export class BnplActivationError extends DomainError {
  constructor(currentStatus: string) {
    super(
      `Cannot activate BNPL transaction with status '${currentStatus}' - must be 'approved'`,
      422,
    );
  }
}

export class LoyaltyPointsError extends DomainError {
  constructor(message: string) {
    super(message, 422);
  }
}
