import { DomainError } from '../../../../packages/core/src/domain/domain-error';

// ============================================================================
// Validation Errors (400)
// ============================================================================

export class DomainValidationError extends DomainError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR', 400);
  }
}

export class InvalidPasswordError extends DomainError {
  constructor(message = 'Password does not meet requirements') {
    super(message, 'INVALID_PASSWORD', 400);
  }
}

export class InvalidVerificationTokenError extends DomainError {
  constructor() {
    super(
      'Verification token is invalid or has expired',
      'INVALID_VERIFICATION_TOKEN',
      400,
    );
  }
}

// ============================================================================
// Authorization Errors (401 / 403)
// ============================================================================

export class InvalidCredentialsError extends DomainError {
  constructor() {
    super('Invalid email or password', 'INVALID_CREDENTIALS', 401);
  }
}

export class EmailNotVerifiedError extends DomainError {
  constructor() {
    super(
      'Please verify your email address before proceeding.',
      'EMAIL_NOT_VERIFIED',
      403,
    );
  }
}

export class UserBlockedError extends DomainError {
  constructor() {
    super(
      'Your account has been blocked. Please contact support.',
      'USER_BLOCKED',
      403,
    );
  }
}

export class UserInactiveError extends DomainError {
  constructor() {
    super(
      'Account is inactive. Please contact support to reactivate your account.',
      'USER_INACTIVE',
      403,
    );
  }
}

// ============================================================================
// Not Found Errors (404)
// ============================================================================

export class UserNotFoundError extends DomainError {
  constructor(identifier?: string) {
    super(
      identifier ? `User '${identifier}' not found` : 'User not found',
      'USER_NOT_FOUND',
      404,
    );
  }
}

export class AddressNotFoundError extends DomainError {
  constructor(addressId?: string) {
    super(
      addressId ? `Address '${addressId}' not found` : 'Address not found',
      'ADDRESS_NOT_FOUND',
      404,
    );
  }
}

export class PaymentMethodNotFoundError extends DomainError {
  constructor(paymentMethodId?: string) {
    super(
      paymentMethodId
        ? `Payment method '${paymentMethodId}' not found`
        : 'Payment method not found',
      'PAYMENT_METHOD_NOT_FOUND',
      404,
    );
  }
}

// ============================================================================
// Conflict Errors (409)
// ============================================================================

export class UserAlreadyExistsError extends DomainError {
  constructor(email: string) {
    super(`User with email '${email}' already exists`, 'USER_ALREADY_EXISTS', 409);
  }
}

export class EmailAlreadyVerifiedError extends DomainError {
  constructor() {
    super('Email is already verified', 'EMAIL_ALREADY_VERIFIED', 409);
  }
}

// ============================================================================
// Business Rule Errors (422)
// ============================================================================

export class InvalidOperationError extends DomainError {
  constructor(message: string) {
    super(message, 'INVALID_OPERATION', 422);
  }
}

