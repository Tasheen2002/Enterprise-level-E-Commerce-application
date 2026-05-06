import { DomainError } from '../../../../packages/core/src/domain/domain-error';

// ─── Validation Errors (400) ─────────────────────────────────────────────────

export class DomainValidationError extends DomainError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR', 400);
  }
}

export class MissingProductIdentifierError extends DomainError {
  constructor() {
    super('Either productId or slug is required', 'MISSING_PRODUCT_IDENTIFIER', 400);
  }
}

export class MissingCategoryIdentifierError extends DomainError {
  constructor() {
    super('Either categoryId or slug is required', 'MISSING_CATEGORY_IDENTIFIER', 400);
  }
}

export class MissingProductTagIdentifierError extends DomainError {
  constructor() {
    super('Either id or name is required', 'MISSING_PRODUCT_TAG_IDENTIFIER', 400);
  }
}

// ─── Not Found Errors (404) ───────────────────────────────────────────────────

export class ProductNotFoundError extends DomainError {
  constructor(identifier?: string) {
    super(
      identifier ? `Product '${identifier}' not found` : 'Product not found',
      'PRODUCT_NOT_FOUND',
      404,
    );
  }
}

export class CategoryNotFoundError extends DomainError {
  constructor(identifier?: string) {
    super(
      identifier ? `Category '${identifier}' not found` : 'Category not found',
      'CATEGORY_NOT_FOUND',
      404,
    );
  }
}

export class ProductVariantNotFoundError extends DomainError {
  constructor(identifier?: string) {
    super(
      identifier
        ? `Product variant '${identifier}' not found`
        : 'Product variant not found',
      'PRODUCT_VARIANT_NOT_FOUND',
      404,
    );
  }
}

export class MediaAssetNotFoundError extends DomainError {
  constructor(identifier?: string) {
    super(
      identifier
        ? `Media asset '${identifier}' not found`
        : 'Media asset not found',
      'MEDIA_ASSET_NOT_FOUND',
      404,
    );
  }
}

export class ProductTagNotFoundError extends DomainError {
  constructor(identifier?: string) {
    super(
      identifier
        ? `Product tag '${identifier}' not found`
        : 'Product tag not found',
      'PRODUCT_TAG_NOT_FOUND',
      404,
    );
  }
}

export class SizeGuideNotFoundError extends DomainError {
  constructor(identifier?: string) {
    super(
      identifier
        ? `Size guide '${identifier}' not found`
        : 'Size guide not found',
      'SIZE_GUIDE_NOT_FOUND',
      404,
    );
  }
}

export class EditorialLookNotFoundError extends DomainError {
  constructor(identifier?: string) {
    super(
      identifier
        ? `Editorial look '${identifier}' not found`
        : 'Editorial look not found',
      'EDITORIAL_LOOK_NOT_FOUND',
      404,
    );
  }
}

// ─── Conflict Errors (409) ────────────────────────────────────────────────────

export class ProductAlreadyExistsError extends DomainError {
  constructor(identifier: string) {
    super(`Product with slug '${identifier}' already exists`, 'PRODUCT_ALREADY_EXISTS', 409);
  }
}

export class CategoryAlreadyExistsError extends DomainError {
  constructor(identifier: string) {
    super(`Category with slug '${identifier}' already exists`, 'CATEGORY_ALREADY_EXISTS', 409);
  }
}

export class SkuAlreadyExistsError extends DomainError {
  constructor(sku: string) {
    super(`SKU '${sku}' is already in use`, 'SKU_ALREADY_EXISTS', 409);
  }
}

export class ProductTagAlreadyExistsError extends DomainError {
  constructor(name: string) {
    super(`Product tag '${name}' already exists`, 'PRODUCT_TAG_ALREADY_EXISTS', 409);
  }
}

// ─── Business Rule Violations (422) ──────────────────────────────────────────

export class InvalidOperationError extends DomainError {
  constructor(message: string) {
    super(message, 'INVALID_OPERATION', 422);
  }
}

export class ProductPublishError extends DomainError {
  constructor(reason: string) {
    super(`Cannot publish product: ${reason}`, 'PRODUCT_PUBLISH_ERROR', 422);
  }
}

export class CategoryDeletionError extends DomainError {
  constructor(reason: string) {
    super(`Cannot delete category: ${reason}`, 'CATEGORY_DELETION_ERROR', 422);
  }
}

export class InvalidPriceError extends DomainError {
  constructor(message = 'Price must be a positive number') {
    super(message, 'INVALID_PRICE', 422);
  }
}

export class InvalidSkuError extends DomainError {
  constructor(message = 'SKU is invalid') {
    super(message, 'INVALID_SKU', 422);
  }
}

export class InvalidSlugError extends DomainError {
  constructor(message = 'Slug is invalid') {
    super(message, 'INVALID_SLUG', 422);
  }
}
