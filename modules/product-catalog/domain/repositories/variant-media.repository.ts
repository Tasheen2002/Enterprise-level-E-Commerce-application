import { VariantMedia } from "../entities/variant-media.entity";
import { VariantId } from "../value-objects/variant-id.vo";
import { MediaAssetId } from "../value-objects/media-asset-id.vo";
import { ProductId } from "../value-objects/product-id.vo";

export interface IVariantMediaRepository {
  // Association management
  addMediaToVariant(variantId: VariantId, assetId: MediaAssetId): Promise<void>;
  removeMediaFromVariant(
    variantId: VariantId,
    assetId: MediaAssetId,
  ): Promise<void>;
  removeAllVariantMedia(variantId: VariantId): Promise<void>;
  removeAllAssetReferences(assetId: MediaAssetId): Promise<void>;

  // Query methods
  findByVariantId(variantId: VariantId): Promise<VariantMedia[]>;
  findByAssetId(assetId: MediaAssetId): Promise<VariantMedia[]>;
  findByProductVariants(productId: ProductId): Promise<VariantMedia[]>;
  findAssociation(
    variantId: VariantId,
    assetId: MediaAssetId,
  ): Promise<VariantMedia | null>;
  findAll(options?: VariantMediaQueryOptions): Promise<VariantMedia[]>;

  // Bulk operations
  setVariantMedia(
    variantId: VariantId,
    assetIds: MediaAssetId[],
  ): Promise<void>;
  addMediaToMultipleVariants(
    variantIds: VariantId[],
    assetId: MediaAssetId,
  ): Promise<void>;
  addMultipleMediaToVariant(
    variantId: VariantId,
    assetIds: MediaAssetId[],
  ): Promise<void>;
  duplicateVariantMedia(
    sourceVariantId: VariantId,
    targetVariantId: VariantId,
  ): Promise<void>;

  // Product-level variant media operations
  getProductVariantMedia(
    productId: ProductId,
  ): Promise<Array<{ variantId: VariantId; media: VariantMedia[] }>>;
  copyProductVariantMedia(
    sourceProductId: ProductId,
    targetProductId: ProductId,
    variantMapping: Map<VariantId, VariantId>,
  ): Promise<void>;

  // Validation methods
  exists(variantId: VariantId, assetId: MediaAssetId): Promise<boolean>;
  isMediaAssociatedWithVariant(
    variantId: VariantId,
    assetId: MediaAssetId,
  ): Promise<boolean>;
  hasVariantMedia(variantId: VariantId): Promise<boolean>;

  // Analytics and utility methods
  countVariantMedia(variantId: VariantId): Promise<number>;
  countAssetUsage(assetId: MediaAssetId): Promise<number>;
  count(options?: VariantMediaCountOptions): Promise<number>;
  getVariantsUsingAsset(assetId: MediaAssetId): Promise<VariantId[]>;
  getUnusedAssets(productId?: ProductId): Promise<MediaAssetId[]>;

  // Color/size specific media management
  findByVariantColor(
    color: string,
    options?: VariantMediaQueryOptions,
  ): Promise<VariantMedia[]>;
  findByVariantSize(
    size: string,
    options?: VariantMediaQueryOptions,
  ): Promise<VariantMedia[]>;
  getColorVariantMedia(
    productId: ProductId,
    color: string,
  ): Promise<VariantMedia[]>;
  getSizeVariantMedia(
    productId: ProductId,
    size: string,
  ): Promise<VariantMedia[]>;
}

export interface VariantMediaQueryOptions {
  limit?: number;
  offset?: number;
  sortBy?: "variantId" | "assetId";
  sortOrder?: "asc" | "desc";
  productId?: string;
}

export interface VariantMediaCountOptions {
  variantId?: string;
  assetId?: string;
  productId?: string;
}
