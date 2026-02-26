import { DomainError } from "@/api/src/shared/domain/domain-error";

// ─── Validation Errors (400) ─────────────────────────────────────────────────

export class DomainValidationError extends DomainError {
  constructor(message: string) {
    super(message, 400);
  }
}

// ─── Not Found Errors (404) ───────────────────────────────────────────────────

export class ProductNotFoundError extends DomainError {
  constructor(identifier?: string) {
    super(
      identifier ? `Product '${identifier}' not found` : "Product not found",
      404,
    );
  }
}

export class CategoryNotFoundError extends DomainError {
  constructor(identifier?: string) {
    super(
      identifier ? `Category '${identifier}' not found` : "Category not found",
      404,
    );
  }
}

export class ProductVariantNotFoundError extends DomainError {
  constructor(identifier?: string) {
    super(
      identifier
        ? `Product variant '${identifier}' not found`
        : "Product variant not found",
      404,
    );
  }
}

export class MediaAssetNotFoundError extends DomainError {
  constructor(identifier?: string) {
    super(
      identifier
        ? `Media asset '${identifier}' not found`
        : "Media asset not found",
      404,
    );
  }
}

export class ProductTagNotFoundError extends DomainError {
  constructor(identifier?: string) {
    super(
      identifier
        ? `Product tag '${identifier}' not found`
        : "Product tag not found",
      404,
    );
  }
}

export class SizeGuideNotFoundError extends DomainError {
  constructor(identifier?: string) {
    super(
      identifier
        ? `Size guide '${identifier}' not found`
        : "Size guide not found",
      404,
    );
  }
}

export class EditorialLookNotFoundError extends DomainError {
  constructor(identifier?: string) {
    super(
      identifier
        ? `Editorial look '${identifier}' not found`
        : "Editorial look not found",
      404,
    );
  }
}

// ─── Conflict Errors (409) ────────────────────────────────────────────────────

export class ProductAlreadyExistsError extends DomainError {
  constructor(identifier: string) {
    super(`Product with slug '${identifier}' already exists`, 409);
  }
}

export class CategoryAlreadyExistsError extends DomainError {
  constructor(identifier: string) {
    super(`Category with slug '${identifier}' already exists`, 409);
  }
}

export class SkuAlreadyExistsError extends DomainError {
  constructor(sku: string) {
    super(`SKU '${sku}' is already in use`, 409);
  }
}

export class ProductTagAlreadyExistsError extends DomainError {
  constructor(name: string) {
    super(`Product tag '${name}' already exists`, 409);
  }
}

// ─── Business Rule Violations (422) ──────────────────────────────────────────

export class InvalidOperationError extends DomainError {
  constructor(message: string) {
    super(message, 422);
  }
}

export class ProductPublishError extends DomainError {
  constructor(reason: string) {
    super(`Cannot publish product: ${reason}`, 422);
  }
}

export class CategoryDeletionError extends DomainError {
  constructor(reason: string) {
    super(`Cannot delete category: ${reason}`, 422);
  }
}

export class InvalidPriceError extends DomainError {
  constructor(message = "Price must be a positive number") {
    super(message, 422);
  }
}

export class InvalidSkuError extends DomainError {
  constructor(message = "SKU is invalid") {
    super(message, 422);
  }
}

export class InvalidSlugError extends DomainError {
  constructor(message = "Slug is invalid") {
    super(message, 422);
  }
}
