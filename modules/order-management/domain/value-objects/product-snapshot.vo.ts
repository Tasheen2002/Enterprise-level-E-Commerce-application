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
  private readonly _productId: string;
  private readonly _variantId: string;
  private readonly _sku: string;
  private readonly _name: string;
  private readonly _variantName?: string;
  private readonly _price: number;
  private readonly _imageUrl?: string;
  private readonly _images?: Array<{ storageKey: string; url?: string }>;
  private readonly _weight?: number;
  private readonly _dimensions?: {
    length: number;
    width: number;
    height: number;
  };
  private readonly _attributes?: Record<string, unknown>;

  private constructor(data: ProductSnapshotData) {
    this._productId = data.productId;
    this._variantId = data.variantId;
    this._sku = data.sku;
    this._name = data.name;
    this._variantName = data.variantName;
    this._price = data.price;
    this._imageUrl = data.imageUrl;
    this._images = data.images;
    this._weight = data.weight;
    this._dimensions = data.dimensions;
    this._attributes = data.attributes;
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

  get productId(): string {
    return this._productId;
  }

  get variantId(): string {
    return this._variantId;
  }

  get sku(): string {
    return this._sku;
  }

  get name(): string {
    return this._name;
  }

  get variantName(): string | undefined {
    return this._variantName;
  }

  get fullName(): string {
    return this._variantName ? `${this._name} - ${this._variantName}` : this._name;
  }

  get price(): number {
    return this._price;
  }

  get imageUrl(): string | undefined {
    return this._imageUrl;
  }

  get images(): Array<{ storageKey: string; url?: string }> | undefined {
    return this._images;
  }

  get weight(): number | undefined {
    return this._weight;
  }

  get dimensions(): { length: number; width: number; height: number } | undefined {
    return this._dimensions;
  }

  get attributes(): Record<string, unknown> | undefined {
    return this._attributes;
  }

  getValue(): ProductSnapshotData {
    return {
      productId: this._productId,
      variantId: this._variantId,
      sku: this._sku,
      name: this._name,
      variantName: this._variantName,
      price: this._price,
      imageUrl: this._imageUrl,
      images: this._images,
      weight: this._weight,
      dimensions: this._dimensions,
      attributes: this._attributes,
    };
  }

  toString(): string {
    return JSON.stringify(this.getValue());
  }

  equals(other: ProductSnapshot): boolean {
    return (
      this._productId === other._productId &&
      this._variantId === other._variantId &&
      this._sku === other._sku &&
      this._name === other._name &&
      this._variantName === other._variantName &&
      this._price === other._price &&
      this._imageUrl === other._imageUrl &&
      JSON.stringify(this._images) === JSON.stringify(other._images) &&
      this._weight === other._weight &&
      JSON.stringify(this._dimensions) === JSON.stringify(other._dimensions) &&
      JSON.stringify(this._attributes) === JSON.stringify(other._attributes)
    );
  }
}
