/**
 * Product Catalog Module — Public API
 *
 * All cross-module imports MUST go through this barrel.
 * Never import directly from internal module paths.
 */

// ─── Domain Errors ────────────────────────────────────────────────────────────
// Re-exported so other modules can catch typed errors without knowing internals
export {
  DomainValidationError,
  ProductNotFoundError,
  CategoryNotFoundError,
  ProductVariantNotFoundError,
  MediaAssetNotFoundError,
  ProductTagNotFoundError,
  SizeGuideNotFoundError,
  EditorialLookNotFoundError,
  ProductAlreadyExistsError,
  CategoryAlreadyExistsError,
  SkuAlreadyExistsError,
  ProductTagAlreadyExistsError,
  InvalidOperationError,
  ProductPublishError,
  CategoryDeletionError,
  InvalidPriceError,
  InvalidSkuError,
  InvalidSlugError,
} from "./domain/errors";

// ─── Domain Enums (folded into VO files — canonical pattern) ─────────────────
// Each VO file exports the enum + namespace-augmented helpers
// (`fromString`, `getDisplayName`, `getAllValues`).
export { ProductStatus } from "./domain/value-objects/product-status.vo";
export { Region } from "./domain/value-objects/region.vo";

// ─── Identity Value Objects ───────────────────────────────────────────────────
// Exported so other modules can reference product-catalog IDs in a type-safe way
export { ProductId } from "./domain/value-objects/product-id.vo";
export { CategoryId } from "./domain/value-objects/category-id.vo";
export { VariantId } from "./domain/value-objects/variant-id.vo";
export { MediaAssetId } from "./domain/value-objects/media-asset-id.vo";
export { ProductTagId } from "./domain/value-objects/product-tag-id.vo";
export { EditorialLookId } from "./domain/value-objects/editorial-look-id.vo";
export { SizeGuideId } from "./domain/value-objects/size-guide-id.vo";

// ─── Application Layer (Commands, Queries, Handlers) ─────────────────────────
export * from "./application";
