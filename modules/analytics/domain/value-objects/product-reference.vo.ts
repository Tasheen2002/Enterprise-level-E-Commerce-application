export class ProductReference {
  private readonly productId: string;
  private readonly variantId?: string;

  private constructor(productId: string, variantId?: string) {
    this.productId = productId;
    this.variantId = variantId;
  }

  static create(productId: string, variantId?: string): ProductReference {
    if (!productId || productId.trim().length === 0) {
      throw new Error('Product ID cannot be empty');
    }
    return new ProductReference(productId, variantId);
  }

  getProductId(): string {
    return this.productId;
  }

  getVariantId(): string | undefined {
    return this.variantId;
  }

  hasVariant(): boolean {
    return !!this.variantId;
  }

  equals(other: ProductReference): boolean {
    return this.productId === other.productId && this.variantId === other.variantId;
  }

  toString(): string {
    return this.variantId
      ? `Product:${this.productId}/Variant:${this.variantId}`
      : `Product:${this.productId}`;
  }
}
