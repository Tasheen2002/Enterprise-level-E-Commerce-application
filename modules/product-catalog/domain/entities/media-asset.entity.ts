import { AggregateRoot } from '../../../../packages/core/src/domain/aggregate-root';
import { DomainEvent } from '../../../../packages/core/src/domain/events/domain-event';
import { DomainValidationError } from "../errors";
import { MediaAssetId } from "../value-objects/media-asset-id.vo";

// ── Domain Events ──────────────────────────────────────────────────────

export class MediaAssetCreatedEvent extends DomainEvent {
  constructor(
    public readonly assetId: string,
    public readonly storageKey: string,
  ) {
    super(assetId, 'MediaAsset');
  }
  get eventType(): string { return 'media-asset.created'; }
  getPayload(): Record<string, unknown> {
    return { assetId: this.assetId, storageKey: this.storageKey };
  }
}

export class MediaAssetUpdatedEvent extends DomainEvent {
  constructor(public readonly assetId: string) {
    super(assetId, 'MediaAsset');
  }
  get eventType(): string { return 'media-asset.updated'; }
  getPayload(): Record<string, unknown> {
    return { assetId: this.assetId };
  }
}

export class MediaAssetDeletedEvent extends DomainEvent {
  constructor(
    public readonly assetId: string,
    public readonly storageKey: string,
  ) {
    super(assetId, 'MediaAsset');
  }
  get eventType(): string { return 'media-asset.deleted'; }
  getPayload(): Record<string, unknown> {
    return { assetId: this.assetId, storageKey: this.storageKey };
  }
}

// ── Props & DTO ────────────────────────────────────────────────────────

export interface MediaAssetProps {
  id: MediaAssetId;
  storageKey: string;
  mime: string;
  width: number | null;
  height: number | null;
  bytes: number | null;
  altText: string | null;
  focalX: number | null;
  focalY: number | null;
  renditions: Record<string, unknown>;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface MediaAssetDTO {
  id: string;
  storageKey: string;
  mime: string;
  width: number | null;
  height: number | null;
  bytes: number | null;
  altText: string | null;
  focalX: number | null;
  focalY: number | null;
  renditions: Record<string, unknown>;
  version: number;
  createdAt: string;
  updatedAt: string;
}

// ── Entity ─────────────────────────────────────────────────────────────

export class MediaAsset extends AggregateRoot {
  private constructor(private props: MediaAssetProps) {
    super();
  }

  static create(params: {
    storageKey: string;
    mime: string;
    width?: number;
    height?: number;
    bytes?: number;
    altText?: string;
    focalX?: number;
    focalY?: number;
    renditions?: Record<string, unknown>;
  }): MediaAsset {
    const assetId = MediaAssetId.create();
    const now = new Date();

    const asset = new MediaAsset({
      id: assetId,
      storageKey: params.storageKey,
      mime: params.mime,
      width: params.width ?? null,
      height: params.height ?? null,
      bytes: params.bytes ?? null,
      altText: params.altText ?? null,
      focalX: params.focalX ?? null,
      focalY: params.focalY ?? null,
      renditions: params.renditions ?? {},
      version: 1,
      createdAt: now,
      updatedAt: now,
    });

    asset.addDomainEvent(
      new MediaAssetCreatedEvent(assetId.getValue(), params.storageKey),
    );

    return asset;
  }

  static fromPersistence(props: MediaAssetProps): MediaAsset {
    return new MediaAsset(props);
  }

  // ── Getters ────────────────────────────────────────────────────────

  get id(): MediaAssetId { return this.props.id; }
  get storageKey(): string { return this.props.storageKey; }
  get mime(): string { return this.props.mime; }
  get width(): number | null { return this.props.width; }
  get height(): number | null { return this.props.height; }
  get bytes(): number | null { return this.props.bytes; }
  get altText(): string | null { return this.props.altText; }
  get focalX(): number | null { return this.props.focalX; }
  get focalY(): number | null { return this.props.focalY; }
  get renditions(): Record<string, unknown> { return this.props.renditions; }
  get version(): number { return this.props.version; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date { return this.props.updatedAt; }

  // ── Business Logic ─────────────────────────────────────────────────

  updateStorageKey(newStorageKey: string): void {
    if (!newStorageKey || newStorageKey.trim().length === 0) {
      throw new DomainValidationError("Storage key cannot be empty");
    }
    this.props.storageKey = newStorageKey.trim();
    this.incrementVersion();
  }

  updateDimensions(width: number | null, height: number | null): void {
    if (width !== null && width <= 0) {
      throw new DomainValidationError("Width must be positive");
    }
    if (height !== null && height <= 0) {
      throw new DomainValidationError("Height must be positive");
    }
    this.props.width = width;
    this.props.height = height;
    this.incrementVersion();
  }

  updateSize(bytes: number | null): void {
    if (bytes !== null && bytes < 0) {
      throw new DomainValidationError("Size cannot be negative");
    }
    this.props.bytes = bytes;
    this.incrementVersion();
  }

  updateAltText(newAltText: string | null): void {
    this.props.altText = newAltText?.trim() || null;
    this.incrementVersion();
  }

  updateFocalPoint(focalX: number | null, focalY: number | null): void {
    if (focalX !== null && (focalX < 0 || focalX > 100)) {
      throw new DomainValidationError("Focal X must be between 0 and 100");
    }
    if (focalY !== null && (focalY < 0 || focalY > 100)) {
      throw new DomainValidationError("Focal Y must be between 0 and 100");
    }
    this.props.focalX = focalX;
    this.props.focalY = focalY;
    this.incrementVersion();
  }

  addRendition(name: string, renditionData: unknown): void {
    if (!name || name.trim().length === 0) {
      throw new DomainValidationError("Rendition name cannot be empty");
    }
    this.props.renditions[name] = renditionData;
    this.incrementVersion();
  }

  removeRendition(name: string): void {
    if (this.props.renditions[name]) {
      delete this.props.renditions[name];
      this.incrementVersion();
    }
  }

  updateRenditions(renditions: Record<string, unknown>): void {
    this.props.renditions = renditions || {};
    this.incrementVersion();
  }

  updateFields(fields: Partial<{
    storageKey: string;
    mime: string;
    width?: number;
    height?: number;
    bytes?: number;
    altText?: string;
    focalX?: number;
    focalY?: number;
    renditions?: Record<string, unknown>;
  }>): void {
    let changed = false;

    if (fields.mime !== undefined && fields.mime !== this.props.mime) {
      this.props.mime = fields.mime;
      changed = true;
    }

    if (fields.width !== undefined && fields.width !== this.props.width) {
      this.props.width = fields.width ?? null;
      changed = true;
    }

    if (fields.height !== undefined && fields.height !== this.props.height) {
      this.props.height = fields.height ?? null;
      changed = true;
    }

    if (fields.bytes !== undefined && fields.bytes !== this.props.bytes) {
      this.props.bytes = fields.bytes ?? null;
      changed = true;
    }

    if (fields.altText !== undefined && fields.altText !== this.props.altText) {
      this.props.altText = fields.altText ?? null;
      changed = true;
    }

    if (fields.focalX !== undefined && fields.focalX !== this.props.focalX) {
      this.props.focalX = fields.focalX ?? null;
      changed = true;
    }

    if (fields.focalY !== undefined && fields.focalY !== this.props.focalY) {
      this.props.focalY = fields.focalY ?? null;
      changed = true;
    }

    if (fields.renditions !== undefined) {
      this.props.renditions = fields.renditions ?? {};
      changed = true;
    }

    if (changed) {
      this.incrementVersion();
    }
  }

  // ── Validation / Query Methods ─────────────────────────────────────

  isImage(): boolean {
    return this.props.mime.startsWith("image/");
  }

  isVideo(): boolean {
    return this.props.mime.startsWith("video/");
  }

  hasRendition(name: string): boolean {
    return name in this.props.renditions;
  }

  getAspectRatio(): number | null {
    if (this.props.width && this.props.height) {
      return this.props.width / this.props.height;
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

  markDeleted(): void {
    this.addDomainEvent(
      new MediaAssetDeletedEvent(
        this.props.id.getValue(),
        this.props.storageKey,
      ),
    );
  }

  // ── Internal ───────────────────────────────────────────────────────

  private incrementVersion(): void {
    this.props.version += 1;
    this.props.updatedAt = new Date();
    this.addDomainEvent(new MediaAssetUpdatedEvent(this.props.id.getValue()));
  }

  // ── Serialisation ──────────────────────────────────────────────────

  equals(other: MediaAsset): boolean {
    return this.props.id.equals(other.props.id);
  }

  static toDTO(entity: MediaAsset): MediaAssetDTO {
    return {
      id: entity.props.id.getValue(),
      storageKey: entity.props.storageKey,
      mime: entity.props.mime,
      width: entity.props.width,
      height: entity.props.height,
      bytes: entity.props.bytes,
      altText: entity.props.altText,
      focalX: entity.props.focalX,
      focalY: entity.props.focalY,
      renditions: entity.props.renditions,
      version: entity.props.version,
      createdAt: entity.props.createdAt.toISOString(),
      updatedAt: entity.props.updatedAt.toISOString(),
    };
  }
}
