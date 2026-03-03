import { DomainError } from "../domain-error";

export class ValidationError extends DomainError {
  constructor(message: string) {
    super(message, 400);
  }
}

export class NotFoundError extends DomainError {
  constructor(resource: string, id?: string) {
    super(id ? `${resource} with id '${id}' not found` : `${resource} not found`, 404);
  }
}

export class ConflictError extends DomainError {
  constructor(message: string) {
    super(message, 409);
  }
}

export class UnauthorizedError extends DomainError {
  constructor(message: string = "Unauthorized") {
    super(message, 401);
  }
}

export class ForbiddenError extends DomainError {
  constructor(message: string = "Access forbidden") {
    super(message, 403);
  }
}
