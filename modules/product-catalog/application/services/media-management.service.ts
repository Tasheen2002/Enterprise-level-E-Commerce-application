import {
  IMediaAssetRepository,
  MediaAssetQueryOptions,
} from "../../domain/repositories/media-asset.repository";
import { MediaAsset, MediaAssetDTO } from "../../domain/entities/media-asset.entity";
import { MediaAssetId } from "../../domain/value-objects/media-asset-id.vo";
import {
  MediaAssetNotFoundError,
  DomainValidationError,
  InvalidOperationError,
} from "../../domain/errors";

/** Input shape for creating/updating a media asset — mirrors MediaAsset.create() params */
type CreateMediaAssetInput = {
  storageKey: string;
  mime: string;
  width?: number;
  height?: number;
  bytes?: number;
  altText?: string;
  focalX?: number;
  focalY?: number;
  renditions?: Record<string, any>;
};

export interface MediaAssetServiceQueryOptions {
  page?: number;
  limit?: number;
  sortBy?: "createdAt" | "bytes" | "width" | "height" | "version";
  sortOrder?: "asc" | "desc";
  hasRenditions?: boolean;
}

export interface MediaAssetStatistics {
  totalAssets: number;
  totalSize: number;
  totalSizeFormatted: string;
  imageCount: number;
  videoCount: number;
  otherCount: number;
  orphanedCount: number;
  averageFileSize: number;
  averageFileSizeFormatted: string;
  assetsWithRenditions: number;
  renditionCoverage: number;
}

export interface MediaAssetFilters {
  mimeType?: string;
  isImage?: boolean;
  isVideo?: boolean;
  hasRenditions?: boolean;
  minBytes?: number;
  maxBytes?: number;
  width?: number;
  height?: number;
}

export class MediaManagementService {
  constructor(private readonly mediaAssetRepository: IMediaAssetRepository) {}

  async createAsset(data: CreateMediaAssetInput): Promise<MediaAssetDTO> {
    const existingAsset = await this.mediaAssetRepository.findByStorageKey(
      data.storageKey,
    );
    if (existingAsset) {
      throw new InvalidOperationError(
        "Media asset with this storage key already exists",
      );
    }

    if (!this.isValidMimeType(data.mime)) {
      throw new DomainValidationError("Invalid MIME type");
    }

    if (data.mime.startsWith("image/")) {
      if (data.width && data.width <= 0) {
        throw new DomainValidationError("Image width must be positive");
      }
      if (data.height && data.height <= 0) {
        throw new DomainValidationError("Image height must be positive");
      }
    }

    if (data.bytes && data.bytes < 0) {
      throw new DomainValidationError("File size cannot be negative");
    }

    if (data.focalX !== undefined && (data.focalX < 0 || data.focalX > 100)) {
      throw new DomainValidationError("Focal X must be between 0 and 100");
    }
    if (data.focalY !== undefined && (data.focalY < 0 || data.focalY > 100)) {
      throw new DomainValidationError("Focal Y must be between 0 and 100");
    }

    const asset = MediaAsset.create(data);
    await this.mediaAssetRepository.save(asset);
    return MediaAsset.toDTO(asset);
  }

  async getAssetById(id: string): Promise<MediaAssetDTO> {
    return MediaAsset.toDTO(await this.getAsset(id));
  }

  async getAssetByStorageKey(storageKey: string): Promise<MediaAssetDTO> {
    const asset = await this.mediaAssetRepository.findByStorageKey(storageKey);
    if (!asset) {
      throw new MediaAssetNotFoundError(storageKey);
    }
    return MediaAsset.toDTO(asset);
  }

  async getAllAssets(
    options: MediaAssetServiceQueryOptions = {},
  ): Promise<MediaAssetDTO[]> {
    const {
      page = 1,
      limit = 20,
      sortBy = "createdAt",
      sortOrder = "desc",
      hasRenditions,
    } = options;

    const repositoryOptions: MediaAssetQueryOptions = {
      limit,
      offset: (page - 1) * limit,
      sortBy,
      sortOrder,
      hasRenditions,
    };

    const assets = await this.mediaAssetRepository.findAll(repositoryOptions);
    return assets.map((a) => MediaAsset.toDTO(a));
  }

  async getAssetsByMimeType(
    mimeType: string,
    options: MediaAssetServiceQueryOptions = {},
  ): Promise<MediaAssetDTO[]> {
    const {
      page = 1,
      limit = 20,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = options;

    const repositoryOptions: MediaAssetQueryOptions = {
      limit,
      offset: (page - 1) * limit,
      sortBy,
      sortOrder,
    };

    const assets = await this.mediaAssetRepository.findByMimeType(mimeType, repositoryOptions);
    return assets.map((a) => MediaAsset.toDTO(a));
  }

  async getImageAssets(
    options: MediaAssetServiceQueryOptions = {},
  ): Promise<MediaAssetDTO[]> {
    const {
      page = 1,
      limit = 20,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = options;

    const repositoryOptions: MediaAssetQueryOptions = {
      limit,
      offset: (page - 1) * limit,
      sortBy,
      sortOrder,
    };

    const assets = await this.mediaAssetRepository.findImages(repositoryOptions);
    return assets.map((a) => MediaAsset.toDTO(a));
  }

  async getVideoAssets(
    options: MediaAssetServiceQueryOptions = {},
  ): Promise<MediaAssetDTO[]> {
    const {
      page = 1,
      limit = 20,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = options;

    const repositoryOptions: MediaAssetQueryOptions = {
      limit,
      offset: (page - 1) * limit,
      sortBy,
      sortOrder,
    };

    const assets = await this.mediaAssetRepository.findVideos(repositoryOptions);
    return assets.map((a) => MediaAsset.toDTO(a));
  }

  async getAssetsByDimensions(
    width: number,
    height: number,
    options: MediaAssetServiceQueryOptions = {},
  ): Promise<MediaAssetDTO[]> {
    const {
      page = 1,
      limit = 20,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = options;

    const repositoryOptions: MediaAssetQueryOptions = {
      limit,
      offset: (page - 1) * limit,
      sortBy,
      sortOrder,
    };

    const assets = await this.mediaAssetRepository.findByDimensions(width, height, repositoryOptions);
    return assets.map((a) => MediaAsset.toDTO(a));
  }

  async getAssetsBySizeRange(
    minBytes: number,
    maxBytes: number,
    options: MediaAssetServiceQueryOptions = {},
  ): Promise<MediaAssetDTO[]> {
    const {
      page = 1,
      limit = 20,
      sortBy = "bytes",
      sortOrder = "asc",
    } = options;

    const repositoryOptions: MediaAssetQueryOptions = {
      limit,
      offset: (page - 1) * limit,
      sortBy,
      sortOrder,
    };

    const assets = await this.mediaAssetRepository.findBySizeRange(minBytes, maxBytes, repositoryOptions);
    return assets.map((a) => MediaAsset.toDTO(a));
  }

  async getOrphanedAssets(): Promise<MediaAssetDTO[]> {
    const assets = await this.mediaAssetRepository.findOrphaned();
    return assets.map((a) => MediaAsset.toDTO(a));
  }

  async updateAsset(
    id: string,
    updateData: Partial<CreateMediaAssetInput>,
  ): Promise<MediaAssetDTO> {
    const asset = await this.getAsset(id);
    asset.updateFields(updateData);
    await this.mediaAssetRepository.save(asset);
    return MediaAsset.toDTO(asset);
  }

  async deleteAsset(id: string): Promise<void> {
    const asset = await this.getAsset(id);
    await this.mediaAssetRepository.delete(asset.id);
  }

  async addRendition(
    id: string,
    name: string,
    renditionData: any,
  ): Promise<MediaAssetDTO> {
    const asset = await this.getAsset(id);

    if (!name || name.trim().length === 0) {
      throw new DomainValidationError("Rendition name cannot be empty");
    }

    asset.addRendition(name, renditionData);
    await this.mediaAssetRepository.save(asset);
    return MediaAsset.toDTO(asset);
  }

  async removeRendition(
    id: string,
    renditionName: string,
  ): Promise<MediaAssetDTO> {
    const asset = await this.getAsset(id);
    asset.removeRendition(renditionName);
    await this.mediaAssetRepository.save(asset);
    return MediaAsset.toDTO(asset);
  }

  async getAssetStatistics(): Promise<MediaAssetStatistics> {
    const [
      totalAssets,
      totalSize,
      imageCount,
      videoCount,
      orphanedAssets,
      assetsWithRenditions,
    ] = await Promise.all([
      this.mediaAssetRepository.count(),
      this.mediaAssetRepository.getTotalSize(),
      this.mediaAssetRepository.count({ isImage: true }),
      this.mediaAssetRepository.count({ isVideo: true }),
      this.mediaAssetRepository.findOrphaned(),
      this.mediaAssetRepository.count({ hasRenditions: true }),
    ]);

    const otherCount = totalAssets - imageCount - videoCount;
    const averageFileSize = totalAssets > 0 ? totalSize / totalAssets : 0;
    const renditionCoverage =
      totalAssets > 0 ? (assetsWithRenditions / totalAssets) * 100 : 0;

    return {
      totalAssets,
      totalSize,
      totalSizeFormatted: this.formatFileSize(totalSize),
      imageCount,
      videoCount,
      otherCount,
      orphanedCount: orphanedAssets.length,
      averageFileSize,
      averageFileSizeFormatted: this.formatFileSize(averageFileSize),
      assetsWithRenditions,
      renditionCoverage: Math.round(renditionCoverage * 100) / 100,
    };
  }

  async searchAssets(
    filters: MediaAssetFilters,
    options: MediaAssetServiceQueryOptions = {},
  ): Promise<MediaAssetDTO[]> {
    const {
      page = 1,
      limit = 20,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = options;

    const repositoryOptions = {
      limit,
      offset: (page - 1) * limit,
      sortBy,
      sortOrder,
    };

    const assets = await this.mediaAssetRepository.findWithFilters(filters, repositoryOptions);
    return assets.map((a) => MediaAsset.toDTO(a));
  }

  async cleanupOrphanedAssets(): Promise<{
    deletedCount: number;
    totalSize: number;
  }> {
    const orphanedAssets = await this.mediaAssetRepository.findOrphaned();

    let totalSize = 0;
    for (const asset of orphanedAssets) {
      totalSize += asset.bytes || 0;
      await this.mediaAssetRepository.delete(asset.id);
    }

    return { deletedCount: orphanedAssets.length, totalSize };
  }

  async validateAsset(id: string): Promise<{
    isValid: boolean;
    issues: string[];
  }> {
    const assetId = MediaAssetId.fromString(id);
    const asset = await this.mediaAssetRepository.findById(assetId);

    if (!asset) {
      return { isValid: false, issues: ["Asset not found"] };
    }

    const issues: string[] = [];

    if (!asset.storageKey) {
      issues.push("Missing storage key");
    }

    if (!this.isValidMimeType(asset.mime)) {
      issues.push("Invalid MIME type");
    }

    if (asset.isImage()) {
      if (!asset.width || !asset.height) {
        issues.push("Missing dimensions for image");
      }
    }

    if (asset.focalX !== null && (asset.focalX < 0 || asset.focalX > 100)) {
      issues.push("Invalid focal X coordinate");
    }
    if (asset.focalY !== null && (asset.focalY < 0 || asset.focalY > 100)) {
      issues.push("Invalid focal Y coordinate");
    }

    return { isValid: issues.length === 0, issues };
  }

  async duplicateAsset(id: string, newStorageKey: string): Promise<MediaAssetDTO> {
    const originalAsset = await this.getAsset(id);

    const existingAsset = await this.mediaAssetRepository.findByStorageKey(newStorageKey);
    if (existingAsset) {
      throw new InvalidOperationError(
        "Asset with this storage key already exists",
      );
    }

    const duplicateData: CreateMediaAssetInput = {
      storageKey: newStorageKey,
      mime: originalAsset.mime,
      width: originalAsset.width || undefined,
      height: originalAsset.height || undefined,
      bytes: originalAsset.bytes || undefined,
      altText: originalAsset.altText || undefined,
      focalX: originalAsset.focalX || undefined,
      focalY: originalAsset.focalY || undefined,
      renditions: originalAsset.renditions,
    };

    return await this.createAsset(duplicateData);
  }

  async updateStorageKey(
    id: string,
    newStorageKey: string,
  ): Promise<MediaAssetDTO> {
    const asset = await this.getAsset(id);
    const assetId = MediaAssetId.fromString(id);

    const existingAsset = await this.mediaAssetRepository.findByStorageKey(newStorageKey);
    if (existingAsset && !existingAsset.id.equals(assetId)) {
      throw new InvalidOperationError(
        "Asset with this storage key already exists",
      );
    }

    asset.updateStorageKey(newStorageKey);
    await this.mediaAssetRepository.save(asset);
    return MediaAsset.toDTO(asset);
  }

  private async getAsset(id: string): Promise<MediaAsset> {
    const assetId = MediaAssetId.fromString(id);
    const asset = await this.mediaAssetRepository.findById(assetId);
    if (!asset) {
      throw new MediaAssetNotFoundError(id);
    }
    return asset;
  }

  private isValidMimeType(mimeType: string): boolean {
    const validMimeTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
      "image/svg+xml",
      "image/bmp",
      "image/tiff",
      "video/mp4",
      "video/webm",
      "video/ogg",
      "video/avi",
      "video/mov",
      "video/wmv",
      "video/flv",
      "application/pdf",
      "text/plain",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "audio/mp3",
      "audio/wav",
      "audio/ogg",
      "audio/aac",
    ];

    return (
      validMimeTypes.includes(mimeType.toLowerCase()) ||
      mimeType.startsWith("image/") ||
      mimeType.startsWith("video/") ||
      mimeType.startsWith("audio/")
    );
  }

  private formatFileSize(bytes: number): string {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }
}
