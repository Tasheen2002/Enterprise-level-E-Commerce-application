import { MediaAsset } from "../entities/media-asset.entity";
import { MediaAssetId } from "../value-objects/media-asset-id.vo";

export interface IMediaAssetRepository {
  save(asset: MediaAsset): Promise<void>;
  findById(id: MediaAssetId): Promise<MediaAsset | null>;
  findByStorageKey(storageKey: string): Promise<MediaAsset | null>;
  findAll(options?: MediaAssetQueryOptions): Promise<MediaAsset[]>;
  findByMimeType(
    mimeType: string,
    options?: MediaAssetQueryOptions,
  ): Promise<MediaAsset[]>;
  findImages(options?: MediaAssetQueryOptions): Promise<MediaAsset[]>;
  findVideos(options?: MediaAssetQueryOptions): Promise<MediaAsset[]>;
  findByDimensions(
    width: number,
    height: number,
    options?: MediaAssetQueryOptions,
  ): Promise<MediaAsset[]>;
  findBySizeRange(
    minBytes: number,
    maxBytes: number,
    options?: MediaAssetQueryOptions,
  ): Promise<MediaAsset[]>;
  findOrphaned(): Promise<MediaAsset[]>; // Assets not associated with any product
  delete(id: MediaAssetId): Promise<void>;
  exists(id: MediaAssetId): Promise<boolean>;
  existsByStorageKey(storageKey: string): Promise<boolean>;
  count(options?: MediaAssetCountOptions): Promise<number>;
  getTotalSize(): Promise<number>; // Total size in bytes
  findWithFilters(
    filters: MediaAssetFilters,
    options?: MediaAssetQueryOptions,
  ): Promise<MediaAsset[]>;
}

export interface MediaAssetFilters {
  mimeType?: string;
  isImage?: boolean;
  isVideo?: boolean;
  hasRenditions?: boolean;
  minBytes?: number;
  maxBytes?: number;
}

export interface MediaAssetQueryOptions {
  limit?: number;
  offset?: number;
  sortBy?: "createdAt" | "bytes" | "width" | "height" | "version";
  sortOrder?: "asc" | "desc";
  hasRenditions?: boolean;
}

export interface MediaAssetCountOptions {
  mimeType?: string;
  isImage?: boolean;
  isVideo?: boolean;
  hasRenditions?: boolean;
}
