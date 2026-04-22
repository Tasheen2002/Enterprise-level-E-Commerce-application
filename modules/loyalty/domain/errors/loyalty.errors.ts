import { DomainError } from '../../../../packages/core/src/domain/domain-error';

// ─── Not Found Errors (404) ───────────────────────────────────────────────────

export class LoyaltyAccountNotFoundError extends DomainError {
  constructor(identifier?: string) {
    super(
      identifier
        ? `Loyalty account '${identifier}' not found`
        : 'Loyalty account not found',
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
        : 'Loyalty program not found',
      'LOYALTY_PROGRAM_NOT_FOUND',
      404,
    );
  }
}

export class LoyaltyTransactionNotFoundError extends DomainError {
  constructor(identifier?: string) {
    super(
      identifier
        ? `Loyalty transaction '${identifier}' not found`
        : 'Loyalty transaction not found',
      'LOYALTY_TRANSACTION_NOT_FOUND',
      404,
    );
  }
}

// ─── Conflict Errors (409) ────────────────────────────────────────────────────

export class LoyaltyAccountAlreadyExistsError extends DomainError {
  constructor(userId: string) {
    super(
      `Loyalty account already exists for user '${userId}'`,
      'LOYALTY_ACCOUNT_ALREADY_EXISTS',
      409,
    );
  }
}

// ─── Business Rule Violations (422) ──────────────────────────────────────────

export class InsufficientPointsError extends DomainError {
  constructor(required: number, available: number) {
    super(
      `Insufficient points: required ${required}, available ${available}`,
      'INSUFFICIENT_POINTS',
      422,
    );
  }
}

// ─── Validation Errors (400) ──────────────────────────────────────────────────

export class LoyaltyValidationError extends DomainError {
  constructor(message: string) {
    super(message, 'LOYALTY_VALIDATION_ERROR', 400);
  }
}

export class LoyaltyProgramNameRequiredError extends DomainError {
  constructor() {
    super('Loyalty program name is required', 'PROGRAM_NAME_REQUIRED', 400);
  }
}
