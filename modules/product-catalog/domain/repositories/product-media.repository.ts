import { ProductMedia, ProductMediaId } from "../entities/product-media.entity";
import { ProductId } from "../value-objects/product-id.vo";
import { MediaAssetId } from "../value-objects/media-asset-id.vo";

export interface IProductMediaRepository {
  // Basic CRUD operations
  save(productMedia: ProductMedia): Promise<void>;
  findById(id: ProductMediaId): Promise<ProductMedia | null>;
  update(productMedia: ProductMedia): Promise<void>;
  delete(id: ProductMediaId): Promise<void>;
  exists(id: ProductMediaId): Promise<boolean>;

  // Association management
  addMediaToProduct(
    productId: ProductId,
    assetId: MediaAssetId,
    position?: number,
    isCover?: boolean,
  ): Promise<ProductMediaId>;
  removeMediaFromProduct(
    productId: ProductId,
    assetId: MediaAssetId,
  ): Promise<void>;
  removeAllProductMedia(productId: ProductId): Promise<void>;
  removeAllAssetReferences(assetId: MediaAssetId): Promise<void>;

  // Query methods
  findByProductId(
    productId: ProductId,
    options?: ProductMediaQueryOptions,
  ): Promise<ProductMedia[]>;
  findByAssetId(assetId: MediaAssetId): Promise<ProductMedia[]>;
  findAssociation(
    productId: ProductId,
    assetId: MediaAssetId,
  ): Promise<ProductMedia | null>;
  findAll(options?: ProductMediaQueryOptions): Promise<ProductMedia[]>;

  // Cover image management
  getProductCoverImage(productId: ProductId): Promise<ProductMedia | null>;
  setProductCoverImage(
    productId: ProductId,
    assetId: MediaAssetId,
  ): Promise<void>;
  removeCoverImageFlag(productId: ProductId): Promise<void>;
  updateCoverImage(
    productId: ProductId,
    newAssetId: MediaAssetId,
  ): Promise<void>;

  // Position and ordering management
  reorderProductMedia(
    productId: ProductId,
    mediaOrdering: Array<{ assetId: MediaAssetId; position: number }>,
  ): Promise<void>;
  moveMediaPosition(
    productId: ProductId,
    assetId: MediaAssetId,
    newPosition: number,
  ): Promise<void>;
  getNextPosition(productId: ProductId): Promise<number>;
  compactPositions(productId: ProductId): Promise<void>;

  // Bulk operations
  setProductMedia(
    productId: ProductId,
    mediaData: Array<{
      assetId: MediaAssetId;
      position?: number;
      isCover?: boolean;
    }>,
  ): Promise<void>;
  duplicateProductMedia(
    sourceProductId: ProductId,
    targetProductId: ProductId,
  ): Promise<void>;

  // Analytics and utility methods
  countProductMedia(productId: ProductId): Promise<number>;
  countAssetUsage(assetId: MediaAssetId): Promise<number>;
  count(options?: ProductMediaCountOptions): Promise<number>;

  // Validation methods
  isMediaAssociatedWithProduct(
    productId: ProductId,
    assetId: MediaAssetId,
  ): Promise<boolean>;
  hasProductCoverImage(productId: ProductId): Promise<boolean>;
  getProductsUsingAsset(assetId: MediaAssetId): Promise<ProductId[]>;
}

export interface ProductMediaQueryOptions {
  limit?: number;
  offset?: number;
  sortBy?: "position" | "createdAt" | "isCover";
  sortOrder?: "asc" | "desc";
  includeNullPositions?: boolean;
  coverOnly?: boolean;
}

export interface ProductMediaCountOptions {
  productId?: string;
  assetId?: string;
  isCover?: boolean;
  hasPosition?: boolean;
}
