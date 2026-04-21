import { DomainError } from "../../../../packages/core/src/domain/domain-error";

// ─── Validation Errors (400) ──────────────────────────────────────────────────

export class DomainValidationError extends DomainError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR', 400);
  }
}

// ─── Not Found Errors (404) ───────────────────────────────────────────────────

export class PaymentIntentNotFoundError extends DomainError {
  constructor(identifier?: string) {
    super(
      identifier
        ? `Payment intent '${identifier}' not found`
        : "Payment intent not found",
      'PAYMENT_INTENT_NOT_FOUND',
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
      'PAYMENT_TRANSACTION_NOT_FOUND',
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
      'GIFT_CARD_NOT_FOUND',
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
      'BNPL_TRANSACTION_NOT_FOUND',
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
      'LOYALTY_ACCOUNT_NOT_FOUND',
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
      'LOYALTY_PROGRAM_NOT_FOUND',
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
      'PROMOTION_NOT_FOUND',
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
      'WEBHOOK_EVENT_NOT_FOUND',
      404,
    );
  }
}

// ─── Conflict Errors (409) ────────────────────────────────────────────────────

export class LoyaltyAccountAlreadyExistsError extends DomainError {
  constructor(userId: string, programId: string) {
    super(
      `Loyalty account already exists for user '${userId}' in program '${programId}'`,
      'LOYALTY_ACCOUNT_ALREADY_EXISTS',
      409,
    );
  }
}

export class GiftCardCodeAlreadyExistsError extends DomainError {
  constructor(code: string) {
    super(
      `Gift card with code '${code}' already exists`,
      'GIFT_CARD_CODE_ALREADY_EXISTS',
      409,
    );
  }
}

// ─── Business Rule Violations (422) ──────────────────────────────────────────

export class InvalidOperationError extends DomainError {
  constructor(message: string) {
    super(message, 'INVALID_OPERATION', 422);
  }
}

export class PaymentIntentInvalidStatusError extends DomainError {
  constructor(operation: string, currentStatus: string) {
    super(
      `Cannot ${operation} payment intent with status '${currentStatus}'`,
      'PAYMENT_INTENT_INVALID_STATUS',
      422,
    );
  }
}

export class PaymentIntentNotLinkedToOrderError extends DomainError {
  constructor() {
    super(
      "Payment intent is not linked to an order",
      'PAYMENT_INTENT_NOT_LINKED_TO_ORDER',
      422,
    );
  }
}

export class GiftCardRedemptionError extends DomainError {
  constructor(reason: string) {
    super(
      `Cannot redeem gift card: ${reason}`,
      'GIFT_CARD_REDEMPTION_ERROR',
      422,
    );
  }
}

export class GiftCardRefundError extends DomainError {
  constructor(reason: string) {
    super(
      `Cannot refund gift card: ${reason}`,
      'GIFT_CARD_REFUND_ERROR',
      422,
    );
  }
}

export class GiftCardCancellationError extends DomainError {
  constructor(reason: string) {
    super(
      `Cannot cancel gift card: ${reason}`,
      'GIFT_CARD_CANCELLATION_ERROR',
      422,
    );
  }
}

export class GiftCardExpiryError extends DomainError {
  constructor(reason: string) {
    super(
      `Gift card expiry error: ${reason}`,
      'GIFT_CARD_EXPIRY_ERROR',
      422,
    );
  }
}

export class BnplActivationError extends DomainError {
  constructor(currentStatus: string) {
    super(
      `Cannot activate BNPL transaction with status '${currentStatus}' - must be 'approved'`,
      'BNPL_ACTIVATION_ERROR',
      422,
    );
  }
}

export class LoyaltyPointsError extends DomainError {
  constructor(message: string) {
    super(message, 'LOYALTY_POINTS_ERROR', 422);
  }
}
