import { ProductVariant } from "../entities/product-variant.entity";
import { VariantId } from "../value-objects/variant-id.vo";
import { ProductId } from "../value-objects/product-id.vo";
import { SKU } from "../value-objects/sku.vo";

export interface IProductVariantRepository {
  save(variant: ProductVariant): Promise<void>;
  findById(id: VariantId): Promise<ProductVariant | null>;
  findBySku(sku: SKU): Promise<ProductVariant | null>;
  findByProductId(productId: ProductId): Promise<ProductVariant[]>;
  findAll(options?: VariantQueryOptions): Promise<ProductVariant[]>;
  findBySize(
    size: string,
    options?: VariantQueryOptions,
  ): Promise<ProductVariant[]>;
  findByColor(
    color: string,
    options?: VariantQueryOptions,
  ): Promise<ProductVariant[]>;
  findAvailableForBackorder(): Promise<ProductVariant[]>;
  findAvailableForPreorder(): Promise<ProductVariant[]>;
  delete(id: VariantId): Promise<void>;
  deleteByProductId(productId: ProductId): Promise<void>;
  exists(id: VariantId): Promise<boolean>;
  existsBySku(sku: SKU): Promise<boolean>;
  count(options?: VariantCountOptions): Promise<number>;
}

export interface VariantQueryOptions {
  limit?: number;
  offset?: number;
  sortBy?: "sku" | "createdAt" | "updatedAt";
  sortOrder?: "asc" | "desc";
  includeOutOfStock?: boolean;
}

export interface VariantCountOptions {
  productId?: string;
  size?: string;
  color?: string;
  availableForBackorder?: boolean;
  availableForPreorder?: boolean;
}
