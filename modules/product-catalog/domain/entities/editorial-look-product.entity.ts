import { EditorialLookId } from '../value-objects/editorial-look-id.vo';
import { ProductId } from '../value-objects/product-id.vo';

export interface EditorialLookProductProps {
  id: string;
  editorialLookId: EditorialLookId;
  productId: ProductId;
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface EditorialLookProductDTO {
  id: string;
  editorialLookId: string;
  productId: string;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

export class EditorialLookProduct {
  private constructor(private props: EditorialLookProductProps) {
  }

  static create(params: {
    id: string;
    editorialLookId: string;
    productId: string;
    displayOrder: number;
  }): EditorialLookProduct {
    const now = new Date();
    return new EditorialLookProduct({
      id: params.id,
      editorialLookId: EditorialLookId.fromString(params.editorialLookId),
      productId: ProductId.fromString(params.productId),
      displayOrder: params.displayOrder,
      createdAt: now,
      updatedAt: now,
    });
  }

  static fromPersistence(props: EditorialLookProductProps): EditorialLookProduct {
    return new EditorialLookProduct(props);
  }

  // Getters
  get id(): string {
    return this.props.id;
  }

  get editorialLookId(): EditorialLookId {
    return this.props.editorialLookId;
  }

  get productId(): ProductId {
    return this.props.productId;
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

  isForLook(lookId: EditorialLookId): boolean {
    return this.props.editorialLookId.equals(lookId);
  }

  isForProduct(productId: ProductId): boolean {
    return this.props.productId.equals(productId);
  }

  equals(other: EditorialLookProduct): boolean {
    return this.props.id === other.props.id;
  }

  static toDTO(entity: EditorialLookProduct): EditorialLookProductDTO {
    return {
      id: entity.props.id,
      editorialLookId: entity.props.editorialLookId.getValue(),
      productId: entity.props.productId.getValue(),
      displayOrder: entity.props.displayOrder,
      createdAt: entity.props.createdAt.toISOString(),
      updatedAt: entity.props.updatedAt.toISOString(),
    };
  }
}
