import { DomainValidationError } from "../errors/order-management.errors";

export interface ProductSnapshotData {
  productId: string;
  variantId: string;
  sku: string;
  name: string;
  variantName?: string;
  price: number;
  imageUrl?: string;
  images?: Array<{ storageKey: string; url?: string }>;
  weight?: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
  attributes?: Record<string, unknown>;
}

export class ProductSnapshot {
  private readonly props: ProductSnapshotData;

  private constructor(data: ProductSnapshotData) {
    this.props = { ...data };
  }

  static create(data: ProductSnapshotData): ProductSnapshot {
    if (!data.productId || data.productId.trim().length === 0) {
      throw new DomainValidationError("Product ID is required");
    }
    if (!data.variantId || data.variantId.trim().length === 0) {
      throw new DomainValidationError("Variant ID is required");
    }
    if (!data.sku || data.sku.trim().length === 0) {
      throw new DomainValidationError("SKU is required");
    }
    if (!data.name || data.name.trim().length === 0) {
      throw new DomainValidationError("Product name is required");
    }
    if (data.price < 0) {
      throw new DomainValidationError("Price cannot be negative");
    }
    if (data.weight !== undefined && data.weight < 0) {
      throw new DomainValidationError("Weight cannot be negative");
    }

    return new ProductSnapshot(data);
  }

  get productId(): string { return this.props.productId; }
  get variantId(): string { return this.props.variantId; }
  get sku(): string { return this.props.sku; }
  get name(): string { return this.props.name; }
  get variantName(): string | undefined { return this.props.variantName; }
  get fullName(): string {
    return this.props.variantName
      ? `${this.props.name} - ${this.props.variantName}`
      : this.props.name;
  }
  get price(): number { return this.props.price; }
  get imageUrl(): string | undefined { return this.props.imageUrl; }
  get images(): Array<{ storageKey: string; url?: string }> | undefined { return this.props.images; }
  get weight(): number | undefined { return this.props.weight; }
  get dimensions(): { length: number; width: number; height: number } | undefined { return this.props.dimensions; }
  get attributes(): Record<string, unknown> | undefined { return this.props.attributes; }

  getValue(): ProductSnapshotData {
    return { ...this.props };
  }

  toString(): string {
    return JSON.stringify(this.getValue());
  }

  equals(other: ProductSnapshot): boolean {
    return (
      this.props.productId === other.props.productId &&
      this.props.variantId === other.props.variantId &&
      this.props.sku === other.props.sku &&
      this.props.name === other.props.name &&
      this.props.variantName === other.props.variantName &&
      this.props.price === other.props.price &&
      this.props.imageUrl === other.props.imageUrl &&
      JSON.stringify(this.props.images) === JSON.stringify(other.props.images) &&
      this.props.weight === other.props.weight &&
      JSON.stringify(this.props.dimensions) === JSON.stringify(other.props.dimensions) &&
      JSON.stringify(this.props.attributes) === JSON.stringify(other.props.attributes)
    );
  }
}
