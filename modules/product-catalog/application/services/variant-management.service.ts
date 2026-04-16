import {
  IProductVariantRepository,
  VariantQueryOptions,
} from "../../domain/repositories/product-variant.repository";
import { IProductRepository } from "../../domain/repositories/product.repository";
import {
  ProductVariant,
  ProductVariantDTO,
} from "../../domain/entities/product-variant.entity";
import { VariantId } from "../../domain/value-objects/variant-id.vo";
import { ProductId } from "../../domain/value-objects/product-id.vo";
import { SKU } from "../../domain/value-objects/sku.vo";
import {
  ProductNotFoundError,
  ProductVariantNotFoundError,
  SkuAlreadyExistsError,
  DomainValidationError,
} from "../../domain/errors";

/** Input shape for creating/updating a variant — mirrors ProductVariant.create() params */
type CreateVariantInput = {
  productId: string;
  sku?: string;
  autoSkuValue?: string;
  size?: string;
  color?: string;
  barcode?: string;
  weightG?: number;
  dims?: Record<string, any>;
  taxClass?: string;
  allowBackorder?: boolean;
  allowPreorder?: boolean;
  restockEta?: Date;
};

export interface VariantServiceQueryOptions {
  page?: number;
  limit?: number;
  size?: string;
  color?: string;
  sortBy?: "sku" | "createdAt" | "size" | "color";
  sortOrder?: "asc" | "desc";
}

export interface VariantStatistics {
  totalVariants: number;
  uniqueSizes: string[];
  uniqueColors: string[];
  backorderCount: number;
  preorderCount: number;
  outOfStockCount: number;
}

export class VariantManagementService {
  constructor(
    private readonly productVariantRepository: IProductVariantRepository,
    private readonly productRepository: IProductRepository,
  ) {}

  async createVariant(
    productId: string,
    data: Omit<CreateVariantInput, "productId">,
  ): Promise<ProductVariantDTO> {
    const product = await this.productRepository.findById(
      ProductId.fromString(productId),
    );
    if (!product) {
      throw new ProductNotFoundError(productId);
    }

    if (data.sku) {
      const existingVariant = await this.productVariantRepository.findBySku(
        SKU.fromString(data.sku),
      );
      if (existingVariant) {
        throw new SkuAlreadyExistsError(data.sku);
      }
    }

    if (data.weightG !== undefined && data.weightG < 0) {
      throw new DomainValidationError("Weight cannot be negative");
    }

    if (data.restockEta) {
      const restockDate = new Date(data.restockEta);
      if (isNaN(restockDate.getTime())) {
        throw new DomainValidationError("Invalid restock ETA date");
      }
    }

    const variantData: CreateVariantInput = { ...data, productId };
    const variant = ProductVariant.create(variantData);
    await this.productVariantRepository.save(variant);
    return ProductVariant.toDTO(variant);
  }

  async getVariantById(id: string): Promise<ProductVariantDTO> {
    return ProductVariant.toDTO(await this.getVariant(id));
  }

  async getVariantBySku(sku: string): Promise<ProductVariantDTO> {
    const skuVo = SKU.fromString(sku);
    const variant = await this.productVariantRepository.findBySku(skuVo);
    if (!variant) {
      throw new ProductVariantNotFoundError(sku);
    }
    return ProductVariant.toDTO(variant);
  }

  async getVariantsByProduct(
    productId: string,
    options: VariantServiceQueryOptions = {},
  ): Promise<{ variants: ProductVariantDTO[]; total: number }> {
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

    if (size) {
      variants = variants.filter((v) => v.size === size);
    }

    if (color) {
      variants = variants.filter((v) => v.color === color);
    }

    variants.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case "sku":
          comparison = a.sku.getValue().localeCompare(b.sku.getValue());
          break;
        case "size":
          comparison = (a.size || "").localeCompare(b.size || "");
          break;
        case "color":
          comparison = (a.color || "").localeCompare(b.color || "");
          break;
        case "createdAt":
          comparison = a.createdAt.getTime() - b.createdAt.getTime();
          break;
        default:
          comparison = 0;
      }

      return sortOrder === "asc" ? comparison : -comparison;
    });

    const total = variants.length;
    const startIndex = (page - 1) * limit;
    return {
      variants: variants.slice(startIndex, startIndex + limit).map((v) => ProductVariant.toDTO(v)),
      total,
    };
  }

  async getAllVariants(
    options: VariantServiceQueryOptions = {},
  ): Promise<ProductVariantDTO[]> {
    const {
      page = 1,
      limit = 50,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = options;

    const repositoryOptions: VariantQueryOptions = {
      limit,
      offset: (page - 1) * limit,
      sortBy: sortBy === "color" || sortBy === "size" ? "sku" : sortBy,
      sortOrder,
    };

    const variants = await this.productVariantRepository.findAll(repositoryOptions);
    return variants.map((v) => ProductVariant.toDTO(v));
  }

  async getVariantsBySize(
    size: string,
    options: VariantServiceQueryOptions = {},
  ): Promise<ProductVariantDTO[]> {
    const {
      page = 1,
      limit = 20,
      sortBy = "createdAt",
      sortOrder = "asc",
    } = options;

    const repositoryOptions: VariantQueryOptions = {
      limit,
      offset: (page - 1) * limit,
      sortBy: sortBy === "color" || sortBy === "size" ? "sku" : sortBy,
      sortOrder,
    };

    const variants = await this.productVariantRepository.findBySize(size, repositoryOptions);
    return variants.map((v) => ProductVariant.toDTO(v));
  }

  async getVariantsByColor(
    color: string,
    options: VariantServiceQueryOptions = {},
  ): Promise<ProductVariantDTO[]> {
    const {
      page = 1,
      limit = 20,
      sortBy = "createdAt",
      sortOrder = "asc",
    } = options;

    const repositoryOptions: VariantQueryOptions = {
      limit,
      offset: (page - 1) * limit,
      sortBy: sortBy === "color" || sortBy === "size" ? "sku" : sortBy,
      sortOrder,
    };

    const variants = await this.productVariantRepository.findByColor(color, repositoryOptions);
    return variants.map((v) => ProductVariant.toDTO(v));
  }

  async updateVariant(
    id: string,
    updateData: Partial<CreateVariantInput>,
  ): Promise<ProductVariantDTO> {
    const variantId = VariantId.fromString(id);
    const variant = await this.productVariantRepository.findById(variantId);

    if (!variant) {
      throw new ProductVariantNotFoundError(id);
    }

    if (updateData.sku !== undefined) {
      const newSku = SKU.create(updateData.sku);
      const existingVariant = await this.productVariantRepository.findBySku(newSku);
      if (existingVariant && !existingVariant.id.equals(variantId)) {
        throw new SkuAlreadyExistsError(updateData.sku);
      }
      variant.updateSku(updateData.sku);
    }

    if (updateData.size !== undefined) {
      variant.updateSize(updateData.size);
    }

    if (updateData.color !== undefined) {
      variant.updateColor(updateData.color);
    }

    if (updateData.barcode !== undefined) {
      variant.updateBarcode(updateData.barcode);
    }

    if (updateData.weightG !== undefined) {
      if (updateData.weightG < 0) {
        throw new DomainValidationError("Weight cannot be negative");
      }
      variant.updateWeight(updateData.weightG);
    }

    if (updateData.dims !== undefined) {
      variant.updateDimensions(updateData.dims);
    }

    if (updateData.taxClass !== undefined) {
      variant.updateTaxClass(updateData.taxClass);
    }

    if (updateData.allowBackorder !== undefined) {
      variant.setBackorderPolicy(updateData.allowBackorder);
    }

    if (updateData.allowPreorder !== undefined) {
      variant.setPreorderPolicy(updateData.allowPreorder);
    }

    if (updateData.restockEta !== undefined) {
      if (updateData.restockEta) {
        const restockDate = new Date(updateData.restockEta);
        if (isNaN(restockDate.getTime())) {
          throw new DomainValidationError("Invalid restock ETA date");
        }
      }
      variant.setRestockEta(updateData.restockEta);
    }

    await this.productVariantRepository.save(variant);
    return ProductVariant.toDTO(variant);
  }

  async deleteVariant(id: string): Promise<void> {
    const variantId = VariantId.fromString(id);
    const variant = await this.productVariantRepository.findById(variantId);

    if (!variant) {
      throw new ProductVariantNotFoundError(id);
    }

    await this.productVariantRepository.delete(variantId);
  }

  async deleteVariantsByProduct(productId: string): Promise<void> {
    const productIdVo = ProductId.fromString(productId);
    await this.productVariantRepository.deleteByProductId(productIdVo);
  }

  async getVariantStatistics(productId?: string): Promise<VariantStatistics> {
    let variants: ProductVariant[];

    if (productId) {
      const productIdVo = ProductId.fromString(productId);
      variants = await this.productVariantRepository.findByProductId(productIdVo);
    } else {
      variants = await this.productVariantRepository.findAll();
    }

    const sizes = new Set<string>();
    const colors = new Set<string>();
    let backorderCount = 0;
    let preorderCount = 0;
    const outOfStockCount = 0;

    for (const variant of variants) {
      if (variant.size) sizes.add(variant.size);
      if (variant.color) colors.add(variant.color);
      if (variant.allowBackorder) backorderCount++;
      if (variant.allowPreorder) preorderCount++;
    }

    return {
      totalVariants: variants.length,
      uniqueSizes: Array.from(sizes).sort(),
      uniqueColors: Array.from(colors).sort(),
      backorderCount,
      preorderCount,
      outOfStockCount,
    };
  }

  async getBackorderVariants(): Promise<ProductVariantDTO[]> {
    const variants = await this.productVariantRepository.findAvailableForBackorder();
    return variants.map((v) => ProductVariant.toDTO(v));
  }

  async getPreorderVariants(): Promise<ProductVariantDTO[]> {
    const variants = await this.productVariantRepository.findAvailableForPreorder();
    return variants.map((v) => ProductVariant.toDTO(v));
  }

  async duplicateVariant(id: string, newSku: string): Promise<ProductVariantDTO> {
    const originalVariant = await this.getVariant(id);

    const existingVariant = await this.productVariantRepository.findBySku(
      SKU.fromString(newSku),
    );
    if (existingVariant) {
      throw new SkuAlreadyExistsError(newSku);
    }

    const duplicateData: CreateVariantInput = {
      productId: originalVariant.productId.getValue(),
      sku: newSku,
      size: originalVariant.size || undefined,
      color: originalVariant.color || undefined,
      barcode: originalVariant.barcode || undefined,
      weightG: originalVariant.weightG || undefined,
      dims: originalVariant.dims || undefined,
      taxClass: originalVariant.taxClass || undefined,
      allowBackorder: originalVariant.allowBackorder,
      allowPreorder: originalVariant.allowPreorder,
      restockEta: originalVariant.restockEta || undefined,
    };

    const newVariant = ProductVariant.create(duplicateData);
    await this.productVariantRepository.save(newVariant);
    return ProductVariant.toDTO(newVariant);
  }

  async validateVariant(id: string): Promise<{
    isValid: boolean;
    issues: string[];
  }> {
    const variantId = VariantId.fromString(id);
    const variant = await this.productVariantRepository.findById(variantId);

    if (!variant) {
      return { isValid: false, issues: ["Variant not found"] };
    }

    const issues: string[] = [];

    if (!variant.sku.getValue()) {
      issues.push("Missing SKU");
    }

    if (variant.weightG !== null && variant.weightG < 0) {
      issues.push("Weight cannot be negative");
    }

    const productExists = await this.productRepository.exists(variant.productId);
    if (!productExists) {
      issues.push("Associated product not found");
    }

    return { isValid: issues.length === 0, issues };
  }

  private async getVariant(id: string): Promise<ProductVariant> {
    const variantId = VariantId.fromString(id);
    const variant = await this.productVariantRepository.findById(variantId);
    if (!variant) {
      throw new ProductVariantNotFoundError(id);
    }
    return variant;
  }
}
