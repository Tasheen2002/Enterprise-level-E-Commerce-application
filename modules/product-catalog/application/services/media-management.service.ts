import {
  IMediaAssetRepository,
  MediaAssetQueryOptions,
  MediaAssetFilters,
} from "../../domain/repositories/media-asset.repository";
import { MediaAsset, MediaAssetDTO } from "../../domain/entities/media-asset.entity";
import { MediaAssetId } from "../../domain/value-objects/media-asset-id.vo";
import {
  MediaAssetNotFoundError,
  DomainValidationError,
  InvalidOperationError,
} from "../../domain/errors";
import { PaginatedResult } from "../../../../packages/core/src/domain/interfaces/paginated-result.interface";

// ── Configuration ────────────────────────────────────────────────────

// Hard cap on upload size to protect storage + bandwidth. Adjust per business policy.
const MEDIA_MAX_BYTES = 100 * 1024 * 1024; // 100 MB

const ALLOWED_MIME_TYPES: ReadonlySet<string> = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/avif",
  "video/mp4",
  "video/webm",
  "video/ogg",
  "audio/mp3",
  "audio/mpeg",
  "audio/wav",
  "audio/ogg",
  "audio/aac",
  "application/pdf",
]);

// ── Input / result types ─────────────────────────────────────────────

export interface CreateMediaAssetInput {
  storageKey: string;
  mime: string;
  width?: number;
  height?: number;
  bytes?: number;
  altText?: string;
  focalX?: number;
  focalY?: number;
  renditions?: Record<string, unknown>;
}

export type UpdateMediaAssetInput = Partial<CreateMediaAssetInput>;

export interface MediaAssetServiceQueryOptions {
  page?: number;
  limit?: number;
  sortBy?: "createdAt" | "bytes" | "width" | "height" | "version";
  sortOrder?: "asc" | "desc";
}

// ── Service ───────────────────────────────────────────────────────────

export class MediaManagementService {
  constructor(private readonly mediaAssetRepository: IMediaAssetRepository) {}

  async createAsset(data: CreateMediaAssetInput): Promise<MediaAssetDTO> {
    this.assertAllowedMime(data.mime);
    this.assertWithinSizeLimit(data.bytes);
    await this.assertStorageKeyAvailable(data.storageKey);

    // Entity owns structural validation (non-empty, dimensions positive,
    // focal point bounds, etc.).
    const asset = MediaAsset.create(data);
    await this.mediaAssetRepository.save(asset);
    return MediaAsset.toDTO(asset);
  }

  async getAssetById(id: string): Promise<MediaAssetDTO> {
    return MediaAsset.toDTO(await this.getAsset(id));
  }

  async updateAsset(
    id: string,
    updates: UpdateMediaAssetInput,
  ): Promise<MediaAssetDTO> {
    const asset = await this.getAsset(id);

    if (updates.storageKey !== undefined) {
      await this.assertStorageKeyAvailable(updates.storageKey, asset.id);
      asset.updateStorageKey(updates.storageKey);
    }

    if (updates.mime !== undefined) {
      this.assertAllowedMime(updates.mime);
      asset.updateMime(updates.mime);
    }

    if (updates.bytes !== undefined) {
      this.assertWithinSizeLimit(updates.bytes);
      asset.updateSize(updates.bytes ?? null);
    }

    if (updates.width !== undefined || updates.height !== undefined) {
      asset.updateDimensions(
        updates.width !== undefined ? (updates.width ?? null) : asset.width,
        updates.height !== undefined ? (updates.height ?? null) : asset.height,
      );
    }

    if (updates.altText !== undefined) {
      asset.updateAltText(updates.altText ?? null);
    }

    if (updates.focalX !== undefined || updates.focalY !== undefined) {
      asset.updateFocalPoint(
        updates.focalX !== undefined ? (updates.focalX ?? null) : asset.focalX,
        updates.focalY !== undefined ? (updates.focalY ?? null) : asset.focalY,
      );
    }

    if (updates.renditions !== undefined) {
      asset.updateRenditions(updates.renditions ?? {});
    }

    await this.mediaAssetRepository.save(asset);
    return MediaAsset.toDTO(asset);
  }

  async deleteAsset(id: string): Promise<void> {
    const asset = await this.getAsset(id);
    await this.mediaAssetRepository.delete(asset.id);
  }

  async searchAssets(
    filters: MediaAssetFilters,
    options: MediaAssetServiceQueryOptions = {},
  ): Promise<PaginatedResult<MediaAssetDTO>> {
    const { page = 1, limit = 20, sortBy = "createdAt", sortOrder = "desc" } = options;
    const offset = (page - 1) * limit;

    const repositoryOptions: MediaAssetQueryOptions = { limit, offset, sortBy, sortOrder };

    const [assets, total] = await Promise.all([
      this.mediaAssetRepository.findWithFilters(filters, repositoryOptions),
      this.mediaAssetRepository.count({
        mimeType: filters.mimeType,
        isImage: filters.isImage,
        isVideo: filters.isVideo,
        hasRenditions: filters.hasRenditions,
      }),
    ]);

    return {
      items: assets.map((a) => MediaAsset.toDTO(a)),
      total,
      limit,
      offset,
      hasMore: offset + assets.length < total,
    };
  }

  // ── Private helpers ────────────────────────────────────────────────

  private async getAsset(id: string): Promise<MediaAsset> {
    const assetId = MediaAssetId.fromString(id);
    const asset = await this.mediaAssetRepository.findById(assetId);
    if (!asset) {
      throw new MediaAssetNotFoundError(id);
    }
    return asset;
  }

  private assertAllowedMime(mime: string): void {
    if (!ALLOWED_MIME_TYPES.has(mime.toLowerCase())) {
      throw new DomainValidationError(
        `MIME type "${mime}" is not allowed. Permitted types: ${Array.from(ALLOWED_MIME_TYPES).join(", ")}`,
      );
    }
  }

  private assertWithinSizeLimit(bytes: number | undefined): void {
    if (bytes !== undefined && bytes > MEDIA_MAX_BYTES) {
      throw new DomainValidationError(
        `File size ${bytes} bytes exceeds maximum allowed size of ${MEDIA_MAX_BYTES} bytes`,
      );
    }
  }

  // Race-prone soft check; the DB should also enforce a unique index on storageKey.
  // The global P2002 handler maps DB violations to a 409 response.
  private async assertStorageKeyAvailable(
    storageKey: string,
    excludeId?: MediaAssetId,
  ): Promise<void> {
    const existing = await this.mediaAssetRepository.findByStorageKey(storageKey);
    if (existing && (!excludeId || !existing.id.equals(excludeId))) {
      throw new InvalidOperationError(
        `Media asset with storage key "${storageKey}" already exists`,
      );
    }
  }
}
