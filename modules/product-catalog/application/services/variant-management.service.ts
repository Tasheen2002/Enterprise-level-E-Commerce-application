import {
  IProductVariantRepository,
} from "../../domain/repositories/product-variant.repository";
import { IProductRepository } from "../../domain/repositories/product.repository";
import {
  ProductVariant,
  ProductVariantDTO,
  VariantDimensions,
} from "../../domain/entities/product-variant.entity";
import { VariantId } from "../../domain/value-objects/variant-id.vo";
import { ProductId } from "../../domain/value-objects/product-id.vo";
import { SKU } from "../../domain/value-objects/sku.vo";
import {
  ProductNotFoundError,
  ProductVariantNotFoundError,
  SkuAlreadyExistsError,
} from "../../domain/errors";
import { PaginatedResult } from "../../../../packages/core/src/domain/interfaces/paginated-result.interface";

// ── Input / result types ─────────────────────────────────────────────

export interface CreateVariantInput {
  productId: string;
  sku: string;
  size?: string;
  color?: string;
  barcode?: string;
  weightG?: number;
  dims?: VariantDimensions;
  taxClass?: string;
  allowBackorder?: boolean;
  allowPreorder?: boolean;
  restockEta?: Date;
}

export type UpdateVariantInput = Partial<Omit<CreateVariantInput, "productId">>;

export interface VariantServiceQueryOptions {
  page?: number;
  limit?: number;
  size?: string;
  color?: string;
  sortBy?: "sku" | "createdAt" | "size" | "color";
  sortOrder?: "asc" | "desc";
}

export type VariantListResult = PaginatedResult<ProductVariantDTO>;

// ── Service ───────────────────────────────────────────────────────────

export class VariantManagementService {
  constructor(
    private readonly productVariantRepository: IProductVariantRepository,
    private readonly productRepository: IProductRepository,
  ) {}

  async createVariant(
    productId: string,
    data: Omit<CreateVariantInput, "productId">,
  ): Promise<ProductVariantDTO> {
    await this.assertProductExists(productId);
    await this.assertSkuAvailable(data.sku);

    // Entity owns weight, restockEta, SKU format validation.
    const variant = ProductVariant.create({ ...data, productId });
    await this.productVariantRepository.save(variant);
    return ProductVariant.toDTO(variant);
  }

  async getVariantById(id: string): Promise<ProductVariantDTO> {
    return ProductVariant.toDTO(await this.getVariant(id));
  }

  // PERF: in-memory filter + sort + paginate. For products with many variants,
  // push filtering and sorting to the repo via a richer findByProductId(filters).
  async getVariantsByProduct(
    productId: string,
    options: VariantServiceQueryOptions = {},
  ): Promise<PaginatedResult<ProductVariantDTO>> {
    const {
      page = 1,
      limit = 20,
      size,
      color,
      sortBy = "createdAt",
      sortOrder = "asc",
    } = options;

    const productIdVo = ProductId.fromString(productId);
    let variants = await this.productVariantRepository.findByProductId(productIdVo);

    if (size) variants = variants.filter((v) => v.size === size);
    if (color) variants = variants.filter((v) => v.color === color);

    variants.sort((a, b) => {
      const cmp = compareVariants(a, b, sortBy);
      return sortOrder === "asc" ? cmp : -cmp;
    });

    const total = variants.length;
    const offset = (page - 1) * limit;
    const items = variants
      .slice(offset, offset + limit)
      .map((v) => ProductVariant.toDTO(v));

    return { items, total, limit, offset, hasMore: offset + items.length < total };
  }

  async updateVariant(
    id: string,
    updates: UpdateVariantInput,
  ): Promise<ProductVariantDTO> {
    const variant = await this.getVariant(id);

    if (updates.sku !== undefined) {
      await this.assertSkuAvailable(updates.sku, variant.id);
      variant.updateSku(updates.sku);
    }

    if (updates.size !== undefined) variant.updateSize(updates.size ?? null);
    if (updates.color !== undefined) variant.updateColor(updates.color ?? null);
    if (updates.barcode !== undefined) variant.updateBarcode(updates.barcode ?? null);
    if (updates.weightG !== undefined) variant.updateWeight(updates.weightG ?? null);
    if (updates.dims !== undefined) variant.updateDimensions(updates.dims ?? null);
    if (updates.taxClass !== undefined) variant.updateTaxClass(updates.taxClass ?? null);
    if (updates.allowBackorder !== undefined) variant.setBackorderPolicy(updates.allowBackorder);
    if (updates.allowPreorder !== undefined) variant.setPreorderPolicy(updates.allowPreorder);
    if (updates.restockEta !== undefined) variant.setRestockEta(updates.restockEta ?? null);

    await this.productVariantRepository.save(variant);
    return ProductVariant.toDTO(variant);
  }

  async deleteVariant(id: string): Promise<void> {
    const variant = await this.getVariant(id);
    await this.productVariantRepository.delete(variant.id);
  }

  // ── Private helpers ────────────────────────────────────────────────

  private async getVariant(id: string): Promise<ProductVariant> {
    const variantId = VariantId.fromString(id);
    const variant = await this.productVariantRepository.findById(variantId);
    if (!variant) {
      throw new ProductVariantNotFoundError(id);
    }
    return variant;
  }

  private async assertProductExists(productId: string): Promise<void> {
    const product = await this.productRepository.findById(
      ProductId.fromString(productId),
    );
    if (!product) {
      throw new ProductNotFoundError(productId);
    }
  }

  // Race-prone soft check; the DB should also enforce a unique index on SKU.
  // The global P2002 handler maps DB violations to a 409 response.
  private async assertSkuAvailable(sku: string, excludeId?: VariantId): Promise<void> {
    const existing = await this.productVariantRepository.findBySku(SKU.fromString(sku));
    if (existing && (!excludeId || !existing.id.equals(excludeId))) {
      throw new SkuAlreadyExistsError(sku);
    }
  }
}

// ── Sorting helper (module-private) ─────────────────────────────────

function compareVariants(
  a: ProductVariant,
  b: ProductVariant,
  sortBy: NonNullable<VariantServiceQueryOptions["sortBy"]>,
): number {
  switch (sortBy) {
    case "sku":
      return a.sku.getValue().localeCompare(b.sku.getValue());
    case "size":
      return (a.size ?? "").localeCompare(b.size ?? "");
    case "color":
      return (a.color ?? "").localeCompare(b.color ?? "");
    case "createdAt":
      return a.createdAt.getTime() - b.createdAt.getTime();
  }
}
