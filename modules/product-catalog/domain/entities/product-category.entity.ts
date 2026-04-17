import { ProductId } from '../value-objects/product-id.vo';
import { CategoryId } from '../value-objects/category-id.vo';

export interface ProductCategoryProps {
  id: string;
  productId: ProductId;
  categoryId: CategoryId;
  displayOrder: number;
  isPrimary: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductCategoryDTO {
  id: string;
  productId: string;
  categoryId: string;
  displayOrder: number;
  isPrimary: boolean;
  createdAt: string;
  updatedAt: string;
}

export class ProductCategory {
  private constructor(private props: ProductCategoryProps) {
  }

  static create(params: {
    id: string;
    productId: string;
    categoryId: string;
    displayOrder: number;
    isPrimary: boolean;
  }): ProductCategory {
    const now = new Date();
    return new ProductCategory({
      id: params.id,
      productId: ProductId.fromString(params.productId),
      categoryId: CategoryId.fromString(params.categoryId),
      displayOrder: params.displayOrder,
      isPrimary: params.isPrimary,
      createdAt: now,
      updatedAt: now,
    });
  }

  static fromPersistence(props: ProductCategoryProps): ProductCategory {
    return new ProductCategory(props);
  }

  // Getters
  get id(): string {
    return this.props.id;
  }

  get productId(): ProductId {
    return this.props.productId;
  }

  get categoryId(): CategoryId {
    return this.props.categoryId;
  }

  get displayOrder(): number {
    return this.props.displayOrder;
  }

  get isPrimary(): boolean {
    return this.props.isPrimary;
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

  markAsPrimary(): void {
    this.props.isPrimary = true;
    this.props.updatedAt = new Date();
  }

  unmarkAsPrimary(): void {
    this.props.isPrimary = false;
    this.props.updatedAt = new Date();
  }

  isForProduct(productId: ProductId): boolean {
    return this.props.productId.equals(productId);
  }

  isForCategory(categoryId: CategoryId): boolean {
    return this.props.categoryId.equals(categoryId);
  }

  equals(other: ProductCategory): boolean {
    return this.props.id === other.props.id;
  }

  static toDTO(entity: ProductCategory): ProductCategoryDTO {
    return {
      id: entity.props.id,
      productId: entity.props.productId.getValue(),
      categoryId: entity.props.categoryId.getValue(),
      displayOrder: entity.props.displayOrder,
      isPrimary: entity.props.isPrimary,
      createdAt: entity.props.createdAt.toISOString(),
      updatedAt: entity.props.updatedAt.toISOString(),
    };
  }
}
