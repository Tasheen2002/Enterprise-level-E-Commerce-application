import { DomainError } from "../../../../packages/core/src/domain/domain-error";

// Stable error codes are exposed in API responses so clients can branch on
// them without parsing message strings. Codes are SCREAMING_SNAKE_CASE and
// stable across versions; messages may evolve. Previously every class in
// this file used the 2-arg `super(message, status)` form, which silently
// defaulted `code` to "DOMAIN_ERROR" — every API error in the engagement
// module shared the same code, breaking client-side error branching.

// ─── Validation Errors (400) ─────────────────────────────────────────────────

export class DomainValidationError extends DomainError {
  constructor(message: string) {
    super(message, "ENGAGEMENT_VALIDATION_ERROR", 400);
  }
}

// ─── Not Found Errors (404) ───────────────────────────────────────────────────

export class AppointmentNotFoundError extends DomainError {
  constructor(identifier?: string) {
    super(
      identifier
        ? `Appointment '${identifier}' not found`
        : "Appointment not found",
      "APPOINTMENT_NOT_FOUND",
      404,
    );
  }
}

export class NotificationNotFoundError extends DomainError {
  constructor(identifier?: string) {
    super(
      identifier
        ? `Notification '${identifier}' not found`
        : "Notification not found",
      "NOTIFICATION_NOT_FOUND",
      404,
    );
  }
}

export class ProductReviewNotFoundError extends DomainError {
  constructor(identifier?: string) {
    super(
      identifier
        ? `Product review '${identifier}' not found`
        : "Product review not found",
      "PRODUCT_REVIEW_NOT_FOUND",
      404,
    );
  }
}

export class ReminderNotFoundError extends DomainError {
  constructor(identifier?: string) {
    super(
      identifier ? `Reminder '${identifier}' not found` : "Reminder not found",
      "REMINDER_NOT_FOUND",
      404,
    );
  }
}

export class NewsletterSubscriptionNotFoundError extends DomainError {
  constructor(identifier?: string) {
    super(
      identifier
        ? `Newsletter subscription '${identifier}' not found`
        : "Newsletter subscription not found",
      "NEWSLETTER_SUBSCRIPTION_NOT_FOUND",
      404,
    );
  }
}

export class WishlistNotFoundError extends DomainError {
  constructor(identifier?: string) {
    super(
      identifier ? `Wishlist '${identifier}' not found` : "Wishlist not found",
      "WISHLIST_NOT_FOUND",
      404,
    );
  }
}

export class WishlistItemNotFoundError extends DomainError {
  constructor(identifier?: string) {
    super(
      identifier
        ? `Wishlist item '${identifier}' not found`
        : "Wishlist item not found",
      "WISHLIST_ITEM_NOT_FOUND",
      404,
    );
  }
}

// ─── Conflict Errors (409) ────────────────────────────────────────────────────

export class ProductReviewAlreadyExistsError extends DomainError {
  constructor(productId: string, userId: string) {
    super(
      `Review already exists for product '${productId}' by user '${userId}'`,
      "PRODUCT_REVIEW_ALREADY_EXISTS",
      409,
    );
  }
}

export class NewsletterSubscriptionAlreadyExistsError extends DomainError {
  constructor(email: string) {
    super(
      `Newsletter subscription already exists for '${email}'`,
      "NEWSLETTER_SUBSCRIPTION_ALREADY_EXISTS",
      409,
    );
  }
}

export class WishlistItemAlreadyExistsError extends DomainError {
  constructor(productId: string) {
    super(
      `Product '${productId}' is already in this wishlist`,
      "WISHLIST_ITEM_ALREADY_EXISTS",
      409,
    );
  }
}

// ─── Business Rule Violations (422) ──────────────────────────────────────────

export class InvalidOperationError extends DomainError {
  constructor(message: string) {
    super(message, "INVALID_OPERATION", 422);
  }
}

export class ReviewNotEditableError extends DomainError {
  constructor(status: string) {
    super(
      `Review cannot be edited in '${status}' status`,
      "REVIEW_NOT_EDITABLE",
      422,
    );
  }
}

export class NotificationRetryError extends DomainError {
  constructor() {
    super(
      "Can only retry failed notifications",
      "NOTIFICATION_RETRY_INVALID",
      422,
    );
  }
}

export class AppointmentSchedulingError extends DomainError {
  constructor(reason: string) {
    super(
      `Cannot schedule appointment: ${reason}`,
      "APPOINTMENT_SCHEDULING_INVALID",
      422,
    );
  }
}

export class SubscriptionUnsubscribedError extends DomainError {
  constructor(email: string) {
    super(
      `'${email}' has unsubscribed and cannot receive emails`,
      "SUBSCRIPTION_UNSUBSCRIBED",
      422,
    );
  }
}
