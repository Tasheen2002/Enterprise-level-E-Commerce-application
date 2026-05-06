import { ProductMedia } from "../entities/product-media.entity";
import { ProductId } from "../value-objects/product-id.vo";
import { MediaAssetId } from "../value-objects/media-asset-id.vo";

export interface ProductMediaOrderingItem {
  assetId: MediaAssetId;
  position: number;
}

export interface SetProductMediaItem {
  assetId: MediaAssetId;
  position?: number;
  isPrimary?: boolean;
  alt?: string | null;
  caption?: string | null;
}

export interface IProductMediaRepository {
  // ── Core CRUD ────────────────────────────────────────────────────────
  save(productMedia: ProductMedia): Promise<void>;
  findById(id: string): Promise<ProductMedia | null>;
  delete(id: string): Promise<void>;
  exists(id: string): Promise<boolean>;
  deleteByProductId(productId: ProductId): Promise<void>;
  deleteByAssetId(assetId: MediaAssetId): Promise<void>;

  // ── Association management ───────────────────────────────────────────
  addMediaToProduct(
    productId: ProductId,
    assetId: MediaAssetId,
    position?: number,
    isPrimary?: boolean,
    alt?: string | null,
    caption?: string | null,
  ): Promise<ProductMedia>;
  removeMediaFromProduct(
    productId: ProductId,
    assetId: MediaAssetId,
  ): Promise<void>;
  removeAllProductMedia(productId: ProductId): Promise<void>;
  setProductMedia(
    productId: ProductId,
    mediaData: SetProductMediaItem[],
  ): Promise<void>;
  duplicateProductMedia(
    sourceProductId: ProductId,
    targetProductId: ProductId,
  ): Promise<void>;

  // ── Primary (cover) image management ─────────────────────────────────
  getProductPrimaryMedia(productId: ProductId): Promise<ProductMedia | null>;
  setProductPrimaryMedia(
    productId: ProductId,
    assetId: MediaAssetId,
  ): Promise<void>;
  removePrimaryMediaFlag(productId: ProductId): Promise<void>;
  hasProductPrimaryMedia(productId: ProductId): Promise<boolean>;

  // ── Ordering / positioning ───────────────────────────────────────────
  reorderProductMedia(
    productId: ProductId,
    mediaOrdering: ProductMediaOrderingItem[],
  ): Promise<void>;
  moveMediaPosition(
    productId: ProductId,
    assetId: MediaAssetId,
    newPosition: number,
  ): Promise<void>;
  getNextPosition(productId: ProductId): Promise<number>;
  compactPositions(productId: ProductId): Promise<void>;

  // ── Queries ─────────────────────────────────────────────────────────
  findAll(options?: ProductMediaQueryOptions): Promise<ProductMedia[]>;
  findByProductId(
    productId: ProductId,
    options?: ProductMediaQueryOptions,
  ): Promise<ProductMedia[]>;
  findByAssetId(assetId: MediaAssetId): Promise<ProductMedia[]>;
  findAssociation(
    productId: ProductId,
    assetId: MediaAssetId,
  ): Promise<ProductMedia | null>;

  // ── Counts / utilities ───────────────────────────────────────────────
  count(options?: ProductMediaCountOptions): Promise<number>;
  countByProductId(productId: ProductId): Promise<number>;
  countAssetUsage(assetId: MediaAssetId): Promise<number>;
  getProductsUsingAsset(assetId: MediaAssetId): Promise<ProductId[]>;
  isMediaAssociatedWithProduct(
    productId: ProductId,
    assetId: MediaAssetId,
  ): Promise<boolean>;
}

export interface ProductMediaQueryOptions {
  limit?: number;
  offset?: number;
  sortBy?: "displayOrder" | "createdAt" | "isPrimary";
  sortOrder?: "asc" | "desc";
  includeNullPositions?: boolean;
  primaryOnly?: boolean;
}

export interface ProductMediaCountOptions {
  productId?: ProductId;
  assetId?: MediaAssetId;
  isPrimary?: boolean;
  hasPosition?: boolean;
}
