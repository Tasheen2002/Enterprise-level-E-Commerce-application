import { DomainError } from "../../../../packages/core/src/domain/domain-error";

// ─── Validation Errors (400) ─────────────────────────────────────────────────

export class DomainValidationError extends DomainError {
  constructor(message: string) {
    super(message, 400);
  }
}

// ─── Not Found Errors (404) ───────────────────────────────────────────────────

export class AppointmentNotFoundError extends DomainError {
  constructor(identifier?: string) {
    super(
      identifier
        ? `Appointment '${identifier}' not found`
        : "Appointment not found",
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
      404,
    );
  }
}

export class ReminderNotFoundError extends DomainError {
  constructor(identifier?: string) {
    super(
      identifier ? `Reminder '${identifier}' not found` : "Reminder not found",
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
      404,
    );
  }
}

export class WishlistNotFoundError extends DomainError {
  constructor(identifier?: string) {
    super(
      identifier
        ? `Wishlist '${identifier}' not found`
        : "Wishlist not found",
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
      404,
    );
  }
}

// ─── Conflict Errors (409) ────────────────────────────────────────────────────

export class ProductReviewAlreadyExistsError extends DomainError {
  constructor(productId: string, userId: string) {
    super(
      `Review already exists for product '${productId}' by user '${userId}'`,
      409,
    );
  }
}

export class NewsletterSubscriptionAlreadyExistsError extends DomainError {
  constructor(email: string) {
    super(`Newsletter subscription already exists for '${email}'`, 409);
  }
}

export class WishlistItemAlreadyExistsError extends DomainError {
  constructor(productId: string) {
    super(`Product '${productId}' is already in this wishlist`, 409);
  }
}

// ─── Business Rule Violations (422) ──────────────────────────────────────────

export class InvalidOperationError extends DomainError {
  constructor(message: string) {
    super(message, 422);
  }
}

export class ReviewNotEditableError extends DomainError {
  constructor(status: string) {
    super(`Review cannot be edited in '${status}' status`, 422);
  }
}

export class NotificationRetryError extends DomainError {
  constructor() {
    super("Can only retry failed notifications", 422);
  }
}

export class AppointmentSchedulingError extends DomainError {
  constructor(reason: string) {
    super(`Cannot schedule appointment: ${reason}`, 422);
  }
}

export class SubscriptionUnsubscribedError extends DomainError {
  constructor(email: string) {
    super(`'${email}' has unsubscribed and cannot receive emails`, 422);
  }
}
