import { ProductId } from '../value-objects/product-id.vo';
import { ProductTagId } from '../value-objects/product-tag-id.vo';

export interface ProductTagAssociationProps {
  id: string;
  productId: ProductId;
  tagId: ProductTagId;
  createdAt: Date;
}

export class ProductTagAssociation {
  private props: ProductTagAssociationProps;

  private constructor(props: ProductTagAssociationProps) {
    this.props = props;
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
  getId(): string {
    return this.props.id;
  }

  getProductId(): ProductId {
    return this.props.productId;
  }

  getTagId(): ProductTagId {
    return this.props.tagId;
  }

  getCreatedAt(): Date {
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

export interface ProductTagAssociationDTO {
  id: string;
  productId: string;
  tagId: string;
  createdAt: string;
}
