import { randomUUID } from "crypto";
import { ProductId } from "../value-objects/product-id.vo";
import { MediaAssetId } from "../value-objects/media-asset-id.vo";
import { DomainValidationError } from "../errors";

export class ProductMediaId {
  private constructor(private readonly value: string) {
    if (!value) {
      throw new DomainValidationError("Product Media ID cannot be empty");
    }

    if (!this.isValidUuid(value)) {
      throw new DomainValidationError("Product Media ID must be a valid UUID");
    }
  }

  static create(): ProductMediaId {
    return new ProductMediaId(randomUUID());
  }

  static fromString(value: string): ProductMediaId {
    return new ProductMediaId(value);
  }

  getValue(): string {
    return this.value;
  }

  equals(other: ProductMediaId): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }

  private isValidUuid(uuid: string): boolean {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }
}

export class ProductMedia {
  private constructor(
    private readonly id: ProductMediaId,
    private readonly productId: ProductId,
    private readonly assetId: MediaAssetId,
    private position: number | null,
    private isCover: boolean,
  ) {}

  static create(data: CreateProductMediaData): ProductMedia {
    const productMediaId = ProductMediaId.create();

    return new ProductMedia(
      productMediaId,
      ProductId.fromString(data.productId),
      MediaAssetId.fromString(data.assetId),
      data.position || null,
      data.isCover || false,
    );
  }

  static reconstitute(data: ProductMediaData): ProductMedia {
    return new ProductMedia(
      ProductMediaId.fromString(data.id),
      ProductId.fromString(data.productId),
      MediaAssetId.fromString(data.assetId),
      data.position,
      data.isCover,
    );
  }

  static fromDatabaseRow(row: ProductMediaRow): ProductMedia {
    return new ProductMedia(
      ProductMediaId.fromString(row.product_media_id),
      ProductId.fromString(row.product_id),
      MediaAssetId.fromString(row.asset_id),
      row.position,
      row.is_cover,
    );
  }

  // Getters
  getId(): ProductMediaId {
    return this.id;
  }

  getProductId(): ProductId {
    return this.productId;
  }

  getAssetId(): MediaAssetId {
    return this.assetId;
  }

  getPosition(): number | null {
    return this.position;
  }

  getIsCover(): boolean {
    return this.isCover;
  }

  // Business logic methods
  updatePosition(newPosition: number | null): void {
    if (newPosition !== null && newPosition < 0) {
      throw new DomainValidationError("Position cannot be negative");
    }
    this.position = newPosition;
  }

  setCover(): void {
    this.isCover = true;
  }

  removeCover(): void {
    this.isCover = false;
  }

  // Validation methods
  isForProduct(productId: ProductId): boolean {
    return this.productId.equals(productId);
  }

  isForAsset(assetId: MediaAssetId): boolean {
    return this.assetId.equals(assetId);
  }

  isCoverImage(): boolean {
    return this.isCover;
  }

  hasPosition(): boolean {
    return this.position !== null;
  }

  isAtPosition(position: number): boolean {
    return this.position === position;
  }

  // Convert to data for persistence
  toData(): ProductMediaData {
    return {
      id: this.id.getValue(),
      productId: this.productId.getValue(),
      assetId: this.assetId.getValue(),
      position: this.position,
      isCover: this.isCover,
    };
  }

  toDatabaseRow(): ProductMediaRow {
    return {
      product_media_id: this.id.getValue(),
      product_id: this.productId.getValue(),
      asset_id: this.assetId.getValue(),
      position: this.position,
      is_cover: this.isCover,
    };
  }

  equals(other: ProductMedia): boolean {
    return this.id.equals(other.id);
  }
}

// Supporting types and interfaces
export interface CreateProductMediaData {
  productId: string;
  assetId: string;
  position?: number;
  isCover?: boolean;
}

export interface ProductMediaData {
  id: string;
  productId: string;
  assetId: string;
  position: number | null;
  isCover: boolean;
}

export interface ProductMediaRow {
  product_media_id: string;
  product_id: string;
  asset_id: string;
  position: number | null;
  is_cover: boolean;
}
