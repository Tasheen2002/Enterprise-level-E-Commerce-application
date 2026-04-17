import { DomainError, DomainValidationError } from '../../../../packages/core/src/domain/domain-error';

export class LoyaltyAccountNotFoundError extends DomainError {
  constructor(id: string) {
    super(`Loyalty account '${id}' not found`, 'LOYALTY_ACCOUNT_NOT_FOUND', 404);
  }
}

export class LoyaltyProgramNotFoundError extends DomainError {
  constructor(id: string) {
    super(`Loyalty program '${id}' not found`, 'LOYALTY_PROGRAM_NOT_FOUND', 404);
  }
}

export class LoyaltyTransactionNotFoundError extends DomainError {
  constructor(id: string) {
    super(`Loyalty transaction '${id}' not found`, 'LOYALTY_TRANSACTION_NOT_FOUND', 404);
  }
}

export class InsufficientPointsError extends DomainError {
  constructor(required: number, available: number) {
    super(
      `Insufficient points: required ${required}, available ${available}`,
      'INSUFFICIENT_POINTS',
      422,
    );
  }
}

export class InvalidPointsError extends DomainValidationError {
  constructor(message: string) {
    super(message, 'INVALID_POINTS', 'points');
  }
}

export class LoyaltyProgramNameRequiredError extends DomainValidationError {
  constructor() {
    super('Loyalty program name is required', 'PROGRAM_NAME_REQUIRED', 'name');
  }
}
