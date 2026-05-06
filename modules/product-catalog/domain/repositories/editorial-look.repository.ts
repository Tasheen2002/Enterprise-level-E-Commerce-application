import { EditorialLook } from "../entities/editorial-look.entity";
import { EditorialLookId } from "../value-objects/editorial-look-id.vo";
import { MediaAssetId } from "../value-objects/media-asset-id.vo";
import { ProductId } from "../value-objects/product-id.vo";

export interface IEditorialLookRepository {
  save(look: EditorialLook): Promise<void>;
  findById(id: EditorialLookId): Promise<EditorialLook | null>;
  findAll(options?: EditorialLookQueryOptions): Promise<EditorialLook[]>;
  findPublished(options?: EditorialLookQueryOptions): Promise<EditorialLook[]>;
  findScheduled(options?: EditorialLookQueryOptions): Promise<EditorialLook[]>;
  findDrafts(options?: EditorialLookQueryOptions): Promise<EditorialLook[]>;
  findByProductId(
    productId: ProductId,
    options?: EditorialLookQueryOptions,
  ): Promise<EditorialLook[]>;
  findByHeroAsset(assetId: MediaAssetId): Promise<EditorialLook[]>;
  findReadyToPublish(): Promise<EditorialLook[]>; // Scheduled looks ready to publish
  delete(id: EditorialLookId): Promise<void>;
  exists(id: EditorialLookId): Promise<boolean>;
  count(options?: EditorialLookCountOptions): Promise<number>;
}

export interface EditorialLookQueryOptions {
  limit?: number;
  offset?: number;
  sortBy?: "title" | "publishedAt" | "id";
  sortOrder?: "asc" | "desc";
  includeUnpublished?: boolean;
  hasHeroImage?: boolean;
  hasProducts?: boolean;
}

export interface EditorialLookCountOptions {
  published?: boolean;
  scheduled?: boolean;
  draft?: boolean;
  hasHeroImage?: boolean;
  hasProducts?: boolean;
}
