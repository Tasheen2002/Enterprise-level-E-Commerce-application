export class UserNotFoundError extends Error {
  readonly statusCode = 404;
  constructor(identifier?: string) {
    super(identifier ? `User '${identifier}' not found` : "User not found");
    this.name = "UserNotFoundError";
  }
}

export class UserAlreadyExistsError extends Error {
  readonly statusCode = 409;
  constructor(email: string) {
    super(`User with email '${email}' already exists`);
    this.name = "UserAlreadyExistsError";
  }
}

export class InvalidCredentialsError extends Error {
  readonly statusCode = 401;
  constructor() {
    super("Invalid email or password");
    this.name = "InvalidCredentialsError";
  }
}

export class UserBlockedError extends Error {
  readonly statusCode = 403;
  constructor() {
    super("Your account has been blocked. Please contact support.");
    this.name = "UserBlockedError";
  }
}

export class EmailNotVerifiedError extends Error {
  readonly statusCode = 403;
  constructor() {
    super("Please verify your email address before proceeding.");
    this.name = "EmailNotVerifiedError";
  }
}

export class InvalidVerificationTokenError extends Error {
  readonly statusCode = 400;
  constructor() {
    super("Verification token is invalid or has expired");
    this.name = "InvalidVerificationTokenError";
  }
}

export class VerificationRateLimitError extends Error {
  readonly statusCode = 429;
  constructor() {
    super("Too many verification attempts. Please try again later.");
    this.name = "VerificationRateLimitError";
  }
}

export class InvalidPasswordError extends Error {
  readonly statusCode = 400;
  constructor(message = "Password does not meet requirements") {
    super(message);
    this.name = "InvalidPasswordError";
  }
}

export class TwoFactorRequiredError extends Error {
  readonly statusCode = 401;
  constructor() {
    super("Two-factor authentication is required");
    this.name = "TwoFactorRequiredError";
  }
}

export class InvalidTwoFactorCodeError extends Error {
  readonly statusCode = 401;
  constructor() {
    super("Invalid two-factor authentication code");
    this.name = "InvalidTwoFactorCodeError";
  }
}

export class AddressNotFoundError extends Error {
  readonly statusCode = 404;
  constructor(addressId?: string) {
    super(addressId ? `Address '${addressId}' not found` : "Address not found");
    this.name = "AddressNotFoundError";
  }
}

export class PaymentMethodNotFoundError extends Error {
  readonly statusCode = 404;
  constructor(paymentMethodId?: string) {
    super(paymentMethodId ? `Payment method '${paymentMethodId}' not found` : "Payment method not found");
    this.name = "PaymentMethodNotFoundError";
  }
}
