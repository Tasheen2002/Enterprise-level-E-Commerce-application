import {
  EditorialLook,
  EditorialLookId,
} from "../entities/editorial-look.entity";
import { MediaAssetId } from "../value-objects/media-asset-id.vo";

export interface IEditorialLookRepository {
  save(look: EditorialLook): Promise<void>;
  findById(id: EditorialLookId): Promise<EditorialLook | null>;
  findAll(options?: EditorialLookQueryOptions): Promise<EditorialLook[]>;
  findPublished(options?: EditorialLookQueryOptions): Promise<EditorialLook[]>;
  findScheduled(options?: EditorialLookQueryOptions): Promise<EditorialLook[]>;
  findDrafts(options?: EditorialLookQueryOptions): Promise<EditorialLook[]>;
  findByProductId(
    productId: string,
    options?: EditorialLookQueryOptions,
  ): Promise<EditorialLook[]>;
  findByHeroAsset(assetId: MediaAssetId): Promise<EditorialLook[]>;
  findReadyToPublish(): Promise<EditorialLook[]>; // Scheduled looks ready to publish
  update(look: EditorialLook): Promise<void>;
  delete(id: EditorialLookId): Promise<void>;
  exists(id: EditorialLookId): Promise<boolean>;
  count(options?: EditorialLookCountOptions): Promise<number>;

  // Product-Look associations
  addProductToLook(lookId: EditorialLookId, productId: string): Promise<void>;
  removeProductFromLook(
    lookId: EditorialLookId,
    productId: string,
  ): Promise<void>;
  setLookProducts(lookId: EditorialLookId, productIds: string[]): Promise<void>;
  getLookProducts(lookId: EditorialLookId): Promise<string[]>;
  getProductLooks(productId: string): Promise<EditorialLookId[]>;
  existsProductInLook(
    lookId: EditorialLookId,
    productId: string,
  ): Promise<boolean>;
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
