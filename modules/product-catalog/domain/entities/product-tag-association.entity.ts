import { ProductId } from '../value-objects/product-id.vo';
import { ProductTagId } from '../value-objects/product-tag-id.vo';

export interface ProductTagAssociationProps {
  id: string;
  productId: ProductId;
  tagId: ProductTagId;
  createdAt: Date;
}

export interface ProductTagAssociationDTO {
  id: string;
  productId: string;
  tagId: string;
  createdAt: string;
}

export class ProductTagAssociation {
  private constructor(private props: ProductTagAssociationProps) {
  }

  static create(params: {
    id: string;
    productId: string;
    tagId: string;
  }): ProductTagAssociation {
    const now = new Date();
    return new ProductTagAssociation({
      id: params.id,
      productId: ProductId.fromString(params.productId),
      tagId: ProductTagId.fromString(params.tagId),
      createdAt: now,
    });
  }

  static fromPersistence(props: ProductTagAssociationProps): ProductTagAssociation {
    return new ProductTagAssociation(props);
  }

  // Getters
  get id(): string {
    return this.props.id;
  }

  get productId(): ProductId {
    return this.props.productId;
  }

  get tagId(): ProductTagId {
    return this.props.tagId;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  // Business methods
  isForProduct(productId: ProductId): boolean {
    return this.props.productId.equals(productId);
  }

  isForTag(tagId: ProductTagId): boolean {
    return this.props.tagId.equals(tagId);
  }

  equals(other: ProductTagAssociation): boolean {
    return this.props.id === other.props.id;
  }

  static toDTO(entity: ProductTagAssociation): ProductTagAssociationDTO {
    return {
      id: entity.props.id,
      productId: entity.props.productId.getValue(),
      tagId: entity.props.tagId.getValue(),
      createdAt: entity.props.createdAt.toISOString(),
    };
  }
}
