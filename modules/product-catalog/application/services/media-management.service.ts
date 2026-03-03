import {
  IMediaAssetRepository,
  MediaAssetQueryOptions,
  MediaAssetCountOptions,
} from "../../domain/repositories/media-asset.repository";
import {
  MediaAsset,
  MediaAssetId,
  CreateMediaAssetData,
} from "../../domain/entities/media-asset.entity";
import {
  MediaAssetNotFoundError,
  DomainValidationError,
  InvalidOperationError,
} from "../../domain/errors";

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

  async createAsset(data: CreateMediaAssetData): Promise<MediaAsset> {
    // Check if storage key already exists
    const existingAsset = await this.mediaAssetRepository.findByStorageKey(
      data.storageKey,
    );
    if (existingAsset) {
      throw new InvalidOperationError("Media asset with this storage key already exists");
    }

    // Validate MIME type
    if (!this.isValidMimeType(data.mime)) {
      throw new DomainValidationError("Invalid MIME type");
    }

    // Validate dimensions for images
    if (data.mime.startsWith("image/")) {
      if (data.width && data.width <= 0) {
        throw new DomainValidationError("Image width must be positive");
      }
      if (data.height && data.height <= 0) {
        throw new DomainValidationError("Image height must be positive");
      }
    }

    // Validate file size
    if (data.bytes && data.bytes < 0) {
      throw new DomainValidationError("File size cannot be negative");
    }

    // Validate focal point
    if (data.focalX !== undefined && (data.focalX < 0 || data.focalX > 100)) {
      throw new DomainValidationError("Focal X must be between 0 and 100");
    }
    if (data.focalY !== undefined && (data.focalY < 0 || data.focalY > 100)) {
      throw new DomainValidationError("Focal Y must be between 0 and 100");
    }

    const asset = MediaAsset.create(data);
    await this.mediaAssetRepository.save(asset);
    return asset;
  }

  async getAssetById(id: string): Promise<MediaAsset | null> {
    const assetId = MediaAssetId.fromString(id);
    return await this.mediaAssetRepository.findById(assetId);
  }

  async getAssetByStorageKey(storageKey: string): Promise<MediaAsset | null> {
    return await this.mediaAssetRepository.findByStorageKey(storageKey);
  }

  async getAllAssets(
    options: MediaAssetServiceQueryOptions = {},
  ): Promise<MediaAsset[]> {
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

    return await this.mediaAssetRepository.findAll(repositoryOptions);
  }

  async getAssetsByMimeType(
    mimeType: string,
    options: MediaAssetServiceQueryOptions = {},
  ): Promise<MediaAsset[]> {
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

    return await this.mediaAssetRepository.findByMimeType(
      mimeType,
      repositoryOptions,
    );
  }

  async getImageAssets(
    options: MediaAssetServiceQueryOptions = {},
  ): Promise<MediaAsset[]> {
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

    return await this.mediaAssetRepository.findImages(repositoryOptions);
  }

  async getVideoAssets(
    options: MediaAssetServiceQueryOptions = {},
  ): Promise<MediaAsset[]> {
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

    return await this.mediaAssetRepository.findVideos(repositoryOptions);
  }

  async getAssetsByDimensions(
    width: number,
    height: number,
    options: MediaAssetServiceQueryOptions = {},
  ): Promise<MediaAsset[]> {
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

    return await this.mediaAssetRepository.findByDimensions(
      width,
      height,
      repositoryOptions,
    );
  }

  async getAssetsBySizeRange(
    minBytes: number,
    maxBytes: number,
    options: MediaAssetServiceQueryOptions = {},
  ): Promise<MediaAsset[]> {
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

    return await this.mediaAssetRepository.findBySizeRange(
      minBytes,
      maxBytes,
      repositoryOptions,
    );
  }

  async getOrphanedAssets(): Promise<MediaAsset[]> {
    return await this.mediaAssetRepository.findOrphaned();
  }

  async updateAsset(
    id: string,
    updateData: Partial<CreateMediaAssetData>,
  ): Promise<MediaAsset | null> {
    const assetId = MediaAssetId.fromString(id);
    const asset = await this.mediaAssetRepository.findById(assetId);

    if (!asset) {
      throw new MediaAssetNotFoundError(id);
    }

    // Update all provided fields at once
    asset.updateFields(updateData);

    await this.mediaAssetRepository.update(asset);
    return asset;
  }

  async deleteAsset(id: string): Promise<boolean> {
    const assetId = MediaAssetId.fromString(id);
    const asset = await this.mediaAssetRepository.findById(assetId);

    if (!asset) {
      return false;
    }

    await this.mediaAssetRepository.delete(assetId);
    return true;
  }

  async addRendition(
    id: string,
    name: string,
    renditionData: any,
  ): Promise<MediaAsset | null> {
    const assetId = MediaAssetId.fromString(id);
    const asset = await this.mediaAssetRepository.findById(assetId);

    if (!asset) {
      throw new MediaAssetNotFoundError(id);
    }

    if (!name || name.trim().length === 0) {
      throw new DomainValidationError("Rendition name cannot be empty");
    }

    asset.addRendition(name, renditionData);
    await this.mediaAssetRepository.update(asset);
    return asset;
  }

  async removeRendition(
    id: string,
    renditionName: string,
  ): Promise<MediaAsset | null> {
    const assetId = MediaAssetId.fromString(id);
    const asset = await this.mediaAssetRepository.findById(assetId);

    if (!asset) {
      throw new MediaAssetNotFoundError(id);
    }

    asset.removeRendition(renditionName);
    await this.mediaAssetRepository.update(asset);
    return asset;
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
  ): Promise<MediaAsset[]> {
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

    // Use the repository's findWithFilters method for combined filtering
    return await this.mediaAssetRepository.findWithFilters(
      filters,
      repositoryOptions,
    );
  }

  async cleanupOrphanedAssets(): Promise<{
    deletedCount: number;
    totalSize: number;
  }> {
    const orphanedAssets = await this.mediaAssetRepository.findOrphaned();

    let totalSize = 0;
    for (const asset of orphanedAssets) {
      const assetSize = asset.getBytes() || 0;
      totalSize += assetSize;
      await this.mediaAssetRepository.delete(asset.getId());
    }

    return {
      deletedCount: orphanedAssets.length,
      totalSize,
    };
  }

  async validateAsset(id: string): Promise<{
    isValid: boolean;
    issues: string[];
  }> {
    const assetId = MediaAssetId.fromString(id);
    const asset = await this.mediaAssetRepository.findById(assetId);

    if (!asset) {
      return {
        isValid: false,
        issues: ["Asset not found"],
      };
    }

    const issues: string[] = [];

    // Check if storage key exists
    if (!asset.getStorageKey()) {
      issues.push("Missing storage key");
    }

    // Check if MIME type is valid
    if (!this.isValidMimeType(asset.getMime())) {
      issues.push("Invalid MIME type");
    }

    // Check dimensions for images
    if (asset.isImage()) {
      if (!asset.getWidth() || !asset.getHeight()) {
        issues.push("Missing dimensions for image");
      }
    }

    // Check focal point values
    const focalX = asset.getFocalX();
    const focalY = asset.getFocalY();
    if (focalX !== null && (focalX < 0 || focalX > 100)) {
      issues.push("Invalid focal X coordinate");
    }
    if (focalY !== null && (focalY < 0 || focalY > 100)) {
      issues.push("Invalid focal Y coordinate");
    }

    return {
      isValid: issues.length === 0,
      issues,
    };
  }

  private isValidMimeType(mimeType: string): boolean {
    const validMimeTypes = [
      // Images
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
      "image/svg+xml",
      "image/bmp",
      "image/tiff",
      // Videos
      "video/mp4",
      "video/webm",
      "video/ogg",
      "video/avi",
      "video/mov",
      "video/wmv",
      "video/flv",
      // Documents
      "application/pdf",
      "text/plain",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      // Audio
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

  async duplicateAsset(id: string, newStorageKey: string): Promise<MediaAsset> {
    const assetId = MediaAssetId.fromString(id);
    const originalAsset = await this.mediaAssetRepository.findById(assetId);

    if (!originalAsset) {
      throw new MediaAssetNotFoundError(id);
    }

    // Check if new storage key already exists
    const existingAsset =
      await this.mediaAssetRepository.findByStorageKey(newStorageKey);
    if (existingAsset) {
      throw new InvalidOperationError("Asset with this storage key already exists");
    }

    const duplicateData: CreateMediaAssetData = {
      storageKey: newStorageKey,
      mime: originalAsset.getMime(),
      width: originalAsset.getWidth() || undefined,
      height: originalAsset.getHeight() || undefined,
      bytes: originalAsset.getBytes() || undefined,
      altText: originalAsset.getAltText() || undefined,
      focalX: originalAsset.getFocalX() || undefined,
      focalY: originalAsset.getFocalY() || undefined,
      renditions: originalAsset.getRenditions(),
    };

    return await this.createAsset(duplicateData);
  }

  async updateStorageKey(
    id: string,
    newStorageKey: string,
  ): Promise<MediaAsset | null> {
    const assetId = MediaAssetId.fromString(id);
    const asset = await this.mediaAssetRepository.findById(assetId);

    if (!asset) {
      throw new MediaAssetNotFoundError(id);
    }

    // Check if new storage key already exists
    const existingAsset =
      await this.mediaAssetRepository.findByStorageKey(newStorageKey);
    if (existingAsset && !existingAsset.getId().equals(assetId)) {
      throw new InvalidOperationError("Asset with this storage key already exists");
    }

    asset.updateStorageKey(newStorageKey);
    await this.mediaAssetRepository.update(asset);
    return asset;
  }
}
