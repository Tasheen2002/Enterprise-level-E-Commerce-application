import { VariantMedia } from "../entities/variant-media.entity";
import { VariantId } from "../value-objects/variant-id.vo";
import { MediaAssetId } from "../value-objects/media-asset-id.vo";
import { ProductId } from "../value-objects/product-id.vo";

export interface ProductVariantMediaItem {
  variantId: VariantId;
  media: VariantMedia[];
}

export interface IVariantMediaRepository {
  // ── Core CRUD ───────────────────────────────────────────────────────
  save(variantMedia: VariantMedia): Promise<void>;
  delete(variantId: VariantId, assetId: MediaAssetId): Promise<void>;
  deleteByVariantId(variantId: VariantId): Promise<void>;
  deleteByAssetId(assetId: MediaAssetId): Promise<void>;

  // ── Association management ──────────────────────────────────────────
  addMediaToVariant(variantId: VariantId, assetId: MediaAssetId): Promise<void>;
  removeMediaFromVariant(variantId: VariantId, assetId: MediaAssetId): Promise<void>;
  removeAllVariantMedia(variantId: VariantId): Promise<void>;
  setVariantMedia(variantId: VariantId, assetIds: MediaAssetId[]): Promise<void>;
  addMediaToMultipleVariants(variantIds: VariantId[], assetId: MediaAssetId): Promise<void>;
  addMultipleMediaToVariant(variantId: VariantId, assetIds: MediaAssetId[]): Promise<void>;

  // ── Queries ─────────────────────────────────────────────────────────
  findByVariantId(variantId: VariantId): Promise<VariantMedia[]>;
  findByAssetId(assetId: MediaAssetId): Promise<VariantMedia[]>;
  findAssociation(
    variantId: VariantId,
    assetId: MediaAssetId,
  ): Promise<VariantMedia | null>;

  // ── Variant-attribute filtered media (color/size) ───────────────────
  findByVariantColor(
    color: string,
    options?: VariantMediaQueryOptions,
  ): Promise<VariantMedia[]>;
  findByVariantSize(
    size: string,
    options?: VariantMediaQueryOptions,
  ): Promise<VariantMedia[]>;
  getColorVariantMedia(productId: ProductId, color: string): Promise<VariantMedia[]>;
  getSizeVariantMedia(productId: ProductId, size: string): Promise<VariantMedia[]>;

  // ── Product-level variant media ─────────────────────────────────────
  getProductVariantMedia(productId: ProductId): Promise<ProductVariantMediaItem[]>;
  duplicateVariantMedia(
    sourceVariantId: VariantId,
    targetVariantId: VariantId,
  ): Promise<void>;
  copyProductVariantMedia(
    sourceProductId: ProductId,
    variantIdMapping: Map<string, VariantId>,
  ): Promise<void>;

  // ── Counts / utilities ──────────────────────────────────────────────
  exists(variantId: VariantId, assetId: MediaAssetId): Promise<boolean>;
  countByVariantId(variantId: VariantId): Promise<number>;
  countAssetUsage(assetId: MediaAssetId): Promise<number>;
  getVariantsUsingAsset(assetId: MediaAssetId): Promise<VariantId[]>;
  getUnusedAssets(productId?: ProductId): Promise<MediaAssetId[]>;
}

export interface VariantMediaQueryOptions {
  limit?: number;
  offset?: number;
  sortBy?: "variantId" | "assetId";
  sortOrder?: "asc" | "desc";
  productId?: ProductId;
}
