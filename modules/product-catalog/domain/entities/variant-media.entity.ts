import { VariantId } from "../value-objects/variant-id.vo";
import { MediaAssetId } from "../value-objects/media-asset-id.vo";

export class VariantMedia {
  private constructor(
    private readonly variantId: VariantId,
    private readonly assetId: MediaAssetId,
  ) {}

  static create(data: CreateVariantMediaData): VariantMedia {
    return new VariantMedia(
      VariantId.fromString(data.variantId),
      MediaAssetId.fromString(data.assetId),
    );
  }

  static reconstitute(data: VariantMediaData): VariantMedia {
    return new VariantMedia(
      VariantId.fromString(data.variantId),
      MediaAssetId.fromString(data.assetId),
    );
  }

  static fromDatabaseRow(row: VariantMediaRow): VariantMedia {
    return new VariantMedia(
      VariantId.fromString(row.variant_id),
      MediaAssetId.fromString(row.asset_id),
    );
  }

  // Getters
  getVariantId(): VariantId {
    return this.variantId;
  }

  getAssetId(): MediaAssetId {
    return this.assetId;
  }

  // Validation methods
  isAssociationFor(variantId: VariantId, assetId: MediaAssetId): boolean {
    return this.variantId.equals(variantId) && this.assetId.equals(assetId);
  }

  isForVariant(variantId: VariantId): boolean {
    return this.variantId.equals(variantId);
  }

  isForAsset(assetId: MediaAssetId): boolean {
    return this.assetId.equals(assetId);
  }

  // Business logic methods
  belongsToSameVariantAs(other: VariantMedia): boolean {
    return this.variantId.equals(other.variantId);
  }

  useSameAssetAs(other: VariantMedia): boolean {
    return this.assetId.equals(other.assetId);
  }

  // Convert to data for persistence
  toData(): VariantMediaData {
    return {
      variantId: this.variantId.getValue(),
      assetId: this.assetId.getValue(),
    };
  }

  toDatabaseRow(): VariantMediaRow {
    return {
      variant_id: this.variantId.getValue(),
      asset_id: this.assetId.getValue(),
    };
  }

  equals(other: VariantMedia): boolean {
    return (
      this.variantId.equals(other.variantId) &&
      this.assetId.equals(other.assetId)
    );
  }
}

// Supporting types and interfaces
export interface CreateVariantMediaData {
  variantId: string;
  assetId: string;
}

export interface VariantMediaData {
  variantId: string;
  assetId: string;
}

export interface VariantMediaRow {
  variant_id: string;
  asset_id: string;
}
