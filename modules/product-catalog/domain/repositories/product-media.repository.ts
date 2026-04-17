import { ProductMedia } from "../entities/product-media.entity";
import { ProductId } from "../value-objects/product-id.vo";
import { MediaAssetId } from "../value-objects/media-asset-id.vo";

export interface IProductMediaRepository {
  // Core CRUD
  save(productMedia: ProductMedia): Promise<void>;
  findById(id: string): Promise<ProductMedia | null>;
  delete(id: string): Promise<void>;
  deleteByProductId(productId: ProductId): Promise<void>;
  deleteByAssetId(assetId: MediaAssetId): Promise<void>;

  // Queries
  findByProductId(
    productId: ProductId,
    options?: ProductMediaQueryOptions,
  ): Promise<ProductMedia[]>;
  findByAssetId(assetId: MediaAssetId): Promise<ProductMedia[]>;
  findAssociation(
    productId: ProductId,
    assetId: MediaAssetId,
  ): Promise<ProductMedia | null>;

  // Utility queries
  countByProductId(productId: ProductId): Promise<number>;
  countAssetUsage(assetId: MediaAssetId): Promise<number>;
  getNextPosition(productId: ProductId): Promise<number>;
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
