import { DomainError } from "@/api/src/shared/domain/domain-error";

export class DomainValidationError extends DomainError {
  constructor(message: string) {
    super(message, 400);
  }
}

export class UserNotFoundError extends DomainError {
  constructor(identifier?: string) {
    super(
      identifier ? `User '${identifier}' not found` : "User not found",
      404,
    );
  }
}

export class UserAlreadyExistsError extends DomainError {
  constructor(email: string) {
    super(`User with email '${email}' already exists`, 409);
  }
}

export class InvalidCredentialsError extends DomainError {
  constructor() {
    super("Invalid email or password", 401);
  }
}

export class UserBlockedError extends DomainError {
  constructor() {
    super("Your account has been blocked. Please contact support.", 403);
  }
}

export class EmailNotVerifiedError extends DomainError {
  constructor() {
    super("Please verify your email address before proceeding.", 403);
  }
}

export class InvalidVerificationTokenError extends DomainError {
  constructor() {
    super("Verification token is invalid or has expired", 400);
  }
}

export class VerificationRateLimitError extends DomainError {
  constructor() {
    super("Too many verification attempts. Please try again later.", 429);
  }
}

export class InvalidPasswordError extends DomainError {
  constructor(message = "Password does not meet requirements") {
    super(message, 400);
  }
}

export class TwoFactorRequiredError extends DomainError {
  constructor() {
    super("Two-factor authentication is required", 401);
  }
}

export class InvalidTwoFactorCodeError extends DomainError {
  constructor() {
    super("Invalid two-factor authentication code", 401);
  }
}

export class AddressNotFoundError extends DomainError {
  constructor(addressId?: string) {
    super(
      addressId ? `Address '${addressId}' not found` : "Address not found",
      404,
    );
  }
}

export class PaymentMethodNotFoundError extends DomainError {
  constructor(paymentMethodId?: string) {
    super(
      paymentMethodId
        ? `Payment method '${paymentMethodId}' not found`
        : "Payment method not found",
      404,
    );
  }
}

export class EmailAlreadyVerifiedError extends DomainError {
  constructor() {
    super("Email is already verified", 400);
  }
}

export class UserInactiveError extends DomainError {
  constructor() {
    super(
      "Account is inactive. Please contact support to reactivate your account.",
      403,
    );
  }
}

export class InvalidOperationError extends DomainError {
  constructor(message: string) {
    super(message, 422);
  }
}
