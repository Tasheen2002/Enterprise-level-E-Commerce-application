import { DomainValidationError } from "../errors";
import { MediaAssetId } from "../value-objects/media-asset-id.vo";

export { MediaAssetId };

export class MediaAsset {
  private constructor(
    private readonly id: MediaAssetId,
    private storageKey: string,
    private mime: string,
    private width: number | null,
    private height: number | null,
    private bytes: number | null,
    private altText: string | null,
    private focalX: number | null,
    private focalY: number | null,
    private renditions: Record<string, any>,
    private version: number,
    private readonly createdAt: Date,
  ) {}

  static create(data: CreateMediaAssetData): MediaAsset {
    const assetId = MediaAssetId.create();
    const now = new Date();

    return new MediaAsset(
      assetId,
      data.storageKey,
      data.mime,
      data.width || null,
      data.height || null,
      data.bytes || null,
      data.altText || null,
      data.focalX || null,
      data.focalY || null,
      data.renditions || {},
      1,
      now,
    );
  }

  static reconstitute(data: MediaAssetData): MediaAsset {
    return new MediaAsset(
      MediaAssetId.fromString(data.id),
      data.storageKey,
      data.mime,
      data.width,
      data.height,
      data.bytes,
      data.altText,
      data.focalX,
      data.focalY,
      data.renditions,
      data.version,
      data.createdAt,
    );
  }

  static fromDatabaseRow(row: MediaAssetRow): MediaAsset {
    return new MediaAsset(
      MediaAssetId.fromString(row.asset_id),
      row.storage_key,
      row.mime,
      row.width,
      row.height,
      row.bytes,
      row.alt_text,
      row.focal_x,
      row.focal_y,
      row.renditions,
      row.version,
      row.created_at,
    );
  }

  // Getters
  getId(): MediaAssetId {
    return this.id;
  }

  getStorageKey(): string {
    return this.storageKey;
  }

  getMime(): string {
    return this.mime;
  }

  getWidth(): number | null {
    return this.width;
  }

  getHeight(): number | null {
    return this.height;
  }

  getBytes(): number | null {
    return this.bytes;
  }

  getAltText(): string | null {
    return this.altText;
  }

  getFocalX(): number | null {
    return this.focalX;
  }

  getFocalY(): number | null {
    return this.focalY;
  }

  getRenditions(): Record<string, any> {
    return this.renditions;
  }

  getVersion(): number {
    return this.version;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  // Business logic methods
  updateStorageKey(newStorageKey: string): void {
    if (!newStorageKey || newStorageKey.trim().length === 0) {
      throw new DomainValidationError("Storage key cannot be empty");
    }
    this.storageKey = newStorageKey.trim();
    this.incrementVersion();
  }

  updateDimensions(width: number | null, height: number | null): void {
    if (width !== null && width <= 0) {
      throw new DomainValidationError("Width must be positive");
    }
    if (height !== null && height <= 0) {
      throw new DomainValidationError("Height must be positive");
    }
    this.width = width;
    this.height = height;
  }

  updateSize(bytes: number | null): void {
    if (bytes !== null && bytes < 0) {
      throw new DomainValidationError("Size cannot be negative");
    }
    this.bytes = bytes;
  }

  updateAltText(newAltText: string | null): void {
    this.altText = newAltText?.trim() || null;
  }

  updateFocalPoint(focalX: number | null, focalY: number | null): void {
    if (focalX !== null && (focalX < 0 || focalX > 100)) {
      throw new DomainValidationError("Focal X must be between 0 and 100");
    }
    if (focalY !== null && (focalY < 0 || focalY > 100)) {
      throw new DomainValidationError("Focal Y must be between 0 and 100");
    }
    this.focalX = focalX;
    this.focalY = focalY;
  }

  addRendition(name: string, renditionData: any): void {
    if (!name || name.trim().length === 0) {
      throw new DomainValidationError("Rendition name cannot be empty");
    }
    this.renditions[name] = renditionData;
    this.incrementVersion();
  }

  removeRendition(name: string): void {
    if (this.renditions[name]) {
      delete this.renditions[name];
      this.incrementVersion();
    }
  }

  updateRenditions(renditions: Record<string, any>): void {
    this.renditions = renditions || {};
    this.incrementVersion();
  }

  updateFields(fields: Partial<CreateMediaAssetData>): void {
    let changed = false;

    if (fields.mime !== undefined && fields.mime !== this.mime) {
      this.mime = fields.mime;
      changed = true;
    }

    if (fields.width !== undefined && fields.width !== this.width) {
      this.width = fields.width || null;
      changed = true;
    }

    if (fields.height !== undefined && fields.height !== this.height) {
      this.height = fields.height || null;
      changed = true;
    }

    if (fields.bytes !== undefined && fields.bytes !== this.bytes) {
      this.bytes = fields.bytes || null;
      changed = true;
    }

    if (fields.altText !== undefined && fields.altText !== this.altText) {
      this.altText = fields.altText || null;
      changed = true;
    }

    if (fields.focalX !== undefined && fields.focalX !== this.focalX) {
      this.focalX = fields.focalX || null;
      changed = true;
    }

    if (fields.focalY !== undefined && fields.focalY !== this.focalY) {
      this.focalY = fields.focalY || null;
      changed = true;
    }

    if (fields.renditions !== undefined) {
      this.renditions = fields.renditions || {};
      changed = true;
    }

    if (changed) {
      this.incrementVersion();
    }
  }

  // Validation methods
  isImage(): boolean {
    return this.mime.startsWith("image/");
  }

  isVideo(): boolean {
    return this.mime.startsWith("video/");
  }

  hasRendition(name: string): boolean {
    return name in this.renditions;
  }

  getAspectRatio(): number | null {
    if (this.width && this.height) {
      return this.width / this.height;
    }
    return null;
  }

  isLandscape(): boolean {
    const aspectRatio = this.getAspectRatio();
    return aspectRatio !== null && aspectRatio > 1;
  }

  isPortrait(): boolean {
    const aspectRatio = this.getAspectRatio();
    return aspectRatio !== null && aspectRatio < 1;
  }

  isSquare(): boolean {
    const aspectRatio = this.getAspectRatio();
    return aspectRatio !== null && Math.abs(aspectRatio - 1) < 0.01;
  }

  // Internal methods
  private incrementVersion(): void {
    this.version += 1;
  }

  // Convert to data for persistence
  toData(): MediaAssetData {
    return {
      id: this.id.getValue(),
      storageKey: this.storageKey,
      mime: this.mime,
      width: this.width,
      height: this.height,
      bytes: this.bytes,
      altText: this.altText,
      focalX: this.focalX,
      focalY: this.focalY,
      renditions: this.renditions,
      version: this.version,
      createdAt: this.createdAt,
    };
  }

  toDatabaseRow(): MediaAssetRow {
    return {
      asset_id: this.id.getValue(),
      storage_key: this.storageKey,
      mime: this.mime,
      width: this.width,
      height: this.height,
      bytes: this.bytes,
      alt_text: this.altText,
      focal_x: this.focalX,
      focal_y: this.focalY,
      renditions: this.renditions,
      version: this.version,
      created_at: this.createdAt,
    };
  }

  equals(other: MediaAsset): boolean {
    return this.id.equals(other.id);
  }
}

// Supporting types and interfaces
export interface CreateMediaAssetData {
  storageKey: string;
  mime: string;
  width?: number;
  height?: number;
  bytes?: number;
  altText?: string;
  focalX?: number;
  focalY?: number;
  renditions?: Record<string, any>;
}

export interface MediaAssetData {
  id: string;
  storageKey: string;
  mime: string;
  width: number | null;
  height: number | null;
  bytes: number | null;
  altText: string | null;
  focalX: number | null;
  focalY: number | null;
  renditions: Record<string, any>;
  version: number;
  createdAt: Date;
}

export interface MediaAssetRow {
  asset_id: string;
  storage_key: string;
  mime: string;
  width: number | null;
  height: number | null;
  bytes: number | null;
  alt_text: string | null;
  focal_x: number | null;
  focal_y: number | null;
  renditions: Record<string, any>;
  version: number;
  created_at: Date;
}
