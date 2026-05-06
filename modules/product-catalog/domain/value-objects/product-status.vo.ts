import { DomainValidationError } from "../errors/product-catalog.errors";

// The canonical TS enum for product publication status lives in this file
// alongside helper methods (namespace-augmented). The Product aggregate
// enforces all status invariants internally (`publish()`, `unpublish()`,
// `archive()`, `schedulePublication()`); the namespace augmentation here
// adds boundary helpers (`fromString` / `getDisplayName` / `getAllValues`)
// without forcing every consumer into a Pattern D class wrapper.
export enum ProductStatus {
  DRAFT = "draft",
  PUBLISHED = "published",
  SCHEDULED = "scheduled",
  ARCHIVED = "archived",
}

const ALL_PRODUCT_STATUSES: readonly ProductStatus[] = [
  ProductStatus.DRAFT,
  ProductStatus.PUBLISHED,
  ProductStatus.SCHEDULED,
  ProductStatus.ARCHIVED,
];

export namespace ProductStatus {
  export function fromString(status: string): ProductStatus {
    if (!status || typeof status !== "string") {
      throw new DomainValidationError(
        "Product status must be a non-empty string",
      );
    }
    const normalized = status.toLowerCase();
    if (!ALL_PRODUCT_STATUSES.includes(normalized as ProductStatus)) {
      throw new DomainValidationError(`Invalid product status: ${status}`);
    }
    return normalized as ProductStatus;
  }

  export function getAllValues(): ProductStatus[] {
    return [...ALL_PRODUCT_STATUSES];
  }

  export function getDisplayName(status: ProductStatus): string {
    switch (status) {
      case ProductStatus.DRAFT: return "Draft";
      case ProductStatus.PUBLISHED: return "Published";
      case ProductStatus.SCHEDULED: return "Scheduled";
      case ProductStatus.ARCHIVED: return "Archived";
    }
  }
}
