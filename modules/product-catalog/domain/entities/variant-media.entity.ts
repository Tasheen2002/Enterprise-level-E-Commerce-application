import { VariantId } from '../value-objects/variant-id.vo';
import { MediaAssetId } from '../value-objects/media-asset-id.vo';

export interface VariantMediaProps {
  id: string;
  variantId: VariantId;
  mediaAssetId: MediaAssetId;
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface VariantMediaDTO {
  id: string;
  variantId: string;
  mediaAssetId: string;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

export class VariantMedia {
  private constructor(private props: VariantMediaProps) {
  }

  static create(params: {
    id: string;
    variantId: string;
    mediaAssetId: string;
    displayOrder: number;
  }): VariantMedia {
    const now = new Date();
    return new VariantMedia({
      id: params.id,
      variantId: VariantId.fromString(params.variantId),
      mediaAssetId: MediaAssetId.fromString(params.mediaAssetId),
      displayOrder: params.displayOrder,
      createdAt: now,
      updatedAt: now,
    });
  }

  static fromPersistence(props: VariantMediaProps): VariantMedia {
    return new VariantMedia(props);
  }

  // Getters
  get id(): string {
    return this.props.id;
  }

  get variantId(): VariantId {
    return this.props.variantId;
  }

  get mediaAssetId(): MediaAssetId {
    return this.props.mediaAssetId;
  }

  get displayOrder(): number {
    return this.props.displayOrder;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  // Business methods
  updateDisplayOrder(order: number): void {
    this.props.displayOrder = order;
    this.props.updatedAt = new Date();
  }

  isForVariant(variantId: VariantId): boolean {
    return this.props.variantId.equals(variantId);
  }

  isForAsset(assetId: MediaAssetId): boolean {
    return this.props.mediaAssetId.equals(assetId);
  }

  equals(other: VariantMedia): boolean {
    return this.props.id === other.props.id;
  }

  static toDTO(entity: VariantMedia): VariantMediaDTO {
    return {
      id: entity.props.id,
      variantId: entity.props.variantId.getValue(),
      mediaAssetId: entity.props.mediaAssetId.getValue(),
      displayOrder: entity.props.displayOrder,
      createdAt: entity.props.createdAt.toISOString(),
      updatedAt: entity.props.updatedAt.toISOString(),
    };
  }
}
