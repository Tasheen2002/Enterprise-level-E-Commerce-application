import { ProductId } from '../value-objects/product-id.vo';
import { MediaAssetId } from '../value-objects/media-asset-id.vo';
import { DomainValidationError } from '../errors';

export interface ProductMediaProps {
  id: string;
  productId: ProductId;
  mediaAssetId: MediaAssetId;
  displayOrder: number;
  isPrimary: boolean;
  alt: string | null;
  caption: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductMediaDTO {
  id: string;
  productId: string;
  mediaAssetId: string;
  displayOrder: number;
  isPrimary: boolean;
  alt: string | null;
  caption: string | null;
  createdAt: string;
  updatedAt: string;
}

export class ProductMedia {
  private constructor(private props: ProductMediaProps) {
  }

  static create(params: {
    id: string;
    productId: string;
    mediaAssetId: string;
    displayOrder: number;
    isPrimary?: boolean;
    alt?: string | null;
    caption?: string | null;
  }): ProductMedia {
    const now = new Date();
    return new ProductMedia({
      id: params.id,
      productId: ProductId.fromString(params.productId),
      mediaAssetId: MediaAssetId.fromString(params.mediaAssetId),
      displayOrder: params.displayOrder,
      isPrimary: params.isPrimary ?? false,
      alt: params.alt ?? null,
      caption: params.caption ?? null,
      createdAt: now,
      updatedAt: now,
    });
  }

  static fromPersistence(props: ProductMediaProps): ProductMedia {
    return new ProductMedia(props);
  }

  // Getters
  get id(): string {
    return this.props.id;
  }

  get productId(): ProductId {
    return this.props.productId;
  }

  get mediaAssetId(): MediaAssetId {
    return this.props.mediaAssetId;
  }

  get displayOrder(): number {
    return this.props.displayOrder;
  }

  get isPrimary(): boolean {
    return this.props.isPrimary;
  }

  get alt(): string | null {
    return this.props.alt;
  }

  get caption(): string | null {
    return this.props.caption;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  // Business methods
  updateDisplayOrder(order: number): void {
    if (order < 0) {
      throw new DomainValidationError('Display order cannot be negative');
    }
    this.props.displayOrder = order;
    this.props.updatedAt = new Date();
  }

  markAsPrimary(): void {
    this.props.isPrimary = true;
    this.props.updatedAt = new Date();
  }

  unmarkAsPrimary(): void {
    this.props.isPrimary = false;
    this.props.updatedAt = new Date();
  }

  updateAlt(alt: string | null): void {
    this.props.alt = alt;
    this.props.updatedAt = new Date();
  }

  updateCaption(caption: string | null): void {
    this.props.caption = caption;
    this.props.updatedAt = new Date();
  }

  isForProduct(productId: ProductId): boolean {
    return this.props.productId.equals(productId);
  }

  isForAsset(assetId: MediaAssetId): boolean {
    return this.props.mediaAssetId.equals(assetId);
  }

  equals(other: ProductMedia): boolean {
    return this.props.id === other.props.id;
  }

  static toDTO(entity: ProductMedia): ProductMediaDTO {
    return {
      id: entity.props.id,
      productId: entity.props.productId.getValue(),
      mediaAssetId: entity.props.mediaAssetId.getValue(),
      displayOrder: entity.props.displayOrder,
      isPrimary: entity.props.isPrimary,
      alt: entity.props.alt,
      caption: entity.props.caption,
      createdAt: entity.props.createdAt.toISOString(),
      updatedAt: entity.props.updatedAt.toISOString(),
    };
  }
}
