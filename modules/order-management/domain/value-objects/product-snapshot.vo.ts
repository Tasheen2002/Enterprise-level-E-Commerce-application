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
  attributes?: Record<string, any>;
}

export class ProductSnapshot {
  private readonly productId: string;
  private readonly variantId: string;
  private readonly sku: string;
  private readonly name: string;
  private readonly variantName?: string;
  private readonly price: number;
  private readonly imageUrl?: string;
  private readonly images?: Array<{ storageKey: string; url?: string }>;
  private readonly weight?: number;
  private readonly dimensions?: {
    length: number;
    width: number;
    height: number;
  };
  private readonly attributes?: Record<string, any>;

  private constructor(data: ProductSnapshotData) {
    this.productId = data.productId;
    this.variantId = data.variantId;
    this.sku = data.sku;
    this.name = data.name;
    this.variantName = data.variantName;
    this.price = data.price;
    this.imageUrl = data.imageUrl;
    this.images = data.images;
    this.weight = data.weight;
    this.dimensions = data.dimensions;
    this.attributes = data.attributes;
  }

  static create(data: ProductSnapshotData): ProductSnapshot {
    if (!data.productId || data.productId.trim().length === 0) {
      throw new Error("Product ID is required");
    }

    if (!data.variantId || data.variantId.trim().length === 0) {
      throw new Error("Variant ID is required");
    }

    if (!data.sku || data.sku.trim().length === 0) {
      throw new Error("SKU is required");
    }

    if (!data.name || data.name.trim().length === 0) {
      throw new Error("Product name is required");
    }

    if (data.price < 0) {
      throw new Error("Price cannot be negative");
    }

    if (data.weight !== undefined && data.weight < 0) {
      throw new Error("Weight cannot be negative");
    }

    return new ProductSnapshot(data);
  }

  getProductId(): string {
    return this.productId;
  }

  getVariantId(): string {
    return this.variantId;
  }

  getSku(): string {
    return this.sku;
  }

  getName(): string {
    return this.name;
  }

  getVariantName(): string | undefined {
    return this.variantName;
  }

  getFullName(): string {
    return this.variantName ? `${this.name} - ${this.variantName}` : this.name;
  }

  getPrice(): number {
    return this.price;
  }

  getImageUrl(): string | undefined {
    return this.imageUrl;
  }

  getImages(): Array<{ storageKey: string; url?: string }> | undefined {
    return this.images;
  }

  getWeight(): number | undefined {
    return this.weight;
  }

  getDimensions():
    | { length: number; width: number; height: number }
    | undefined {
    return this.dimensions;
  }

  getAttributes(): Record<string, any> | undefined {
    return this.attributes;
  }

  toJSON(): ProductSnapshotData {
    return {
      productId: this.productId,
      variantId: this.variantId,
      sku: this.sku,
      name: this.name,
      variantName: this.variantName,
      price: this.price,
      imageUrl: this.imageUrl,
      images: this.images,
      weight: this.weight,
      dimensions: this.dimensions,
      attributes: this.attributes,
    };
  }

  equals(other: ProductSnapshot): boolean {
    return (
      this.productId === other.productId &&
      this.variantId === other.variantId &&
      this.sku === other.sku &&
      this.name === other.name &&
      this.variantName === other.variantName &&
      this.price === other.price &&
      this.imageUrl === other.imageUrl &&
      JSON.stringify(this.images) === JSON.stringify(other.images) &&
      this.weight === other.weight &&
      JSON.stringify(this.dimensions) === JSON.stringify(other.dimensions) &&
      JSON.stringify(this.attributes) === JSON.stringify(other.attributes)
    );
  }
}
