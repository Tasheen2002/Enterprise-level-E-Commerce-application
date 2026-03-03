import { PrismaClient } from "@prisma/client";
import {
  IProductVariantRepository,
  VariantQueryOptions,
  VariantCountOptions,
} from "../../../domain/repositories/product-variant.repository";
import { ProductVariant } from "../../../domain/entities/product-variant.entity";
import { VariantId } from "../../../domain/value-objects/variant-id.vo";
import { ProductId } from "../../../domain/value-objects/product-id.vo";
import { SKU } from "../../../domain/value-objects/sku.vo";

function mapRow(variantData: any): ProductVariant {
  return ProductVariant.fromDatabaseRow({
    variant_id: variantData.id,
    product_id: variantData.productId,
    sku: variantData.sku,
    size: variantData.size,
    color: variantData.color,
    barcode: variantData.barcode,
    weight_g: variantData.weightG,
    dims: variantData.dims as any,
    tax_class: variantData.taxClass,
    allow_backorder: variantData.allowBackorder,
    allow_preorder: variantData.allowPreorder,
    restock_eta: variantData.restockEta,
    created_at: variantData.createdAt,
    updated_at: variantData.updatedAt,
  });
}

export class ProductVariantRepository implements IProductVariantRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(variant: ProductVariant): Promise<void> {
    const data = variant.toDatabaseRow();

    await this.prisma.productVariant.create({
      data: {
        id: data.variant_id,
        productId: data.product_id,
        sku: data.sku,
        price: 0,
        size: data.size,
        color: data.color,
        barcode: data.barcode,
        weightG: data.weight_g,
        dims: data.dims as any,
        taxClass: data.tax_class,
        allowBackorder: data.allow_backorder,
        allowPreorder: data.allow_preorder,
        restockEta: data.restock_eta,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      },
    });
  }

  async findById(id: VariantId): Promise<ProductVariant | null> {
    const variantData = await this.prisma.productVariant.findUnique({
      where: { id: id.getValue() },
    });

    if (!variantData) {
      return null;
    }

    return mapRow(variantData);
  }

  async findBySku(sku: SKU): Promise<ProductVariant | null> {
    const variantData = await this.prisma.productVariant.findUnique({
      where: { sku: sku.getValue() },
    });

    if (!variantData) {
      return null;
    }

    return mapRow(variantData);
  }

  async findByProductId(productId: ProductId): Promise<ProductVariant[]> {
    const variants = await this.prisma.productVariant.findMany({
      where: { productId: productId.getValue() },
      orderBy: { createdAt: "desc" },
    });

    return variants.map(mapRow);
  }

  async findAll(options?: VariantQueryOptions): Promise<ProductVariant[]> {
    const {
      limit = 50,
      offset = 0,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = options || {};

    const variants = await this.prisma.productVariant.findMany({
      take: limit,
      skip: offset,
      orderBy: { [sortBy]: sortOrder },
    });

    return variants.map(mapRow);
  }

  async findBySize(
    size: string,
    options?: VariantQueryOptions,
  ): Promise<ProductVariant[]> {
    const {
      limit = 50,
      offset = 0,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = options || {};

    const variants = await this.prisma.productVariant.findMany({
      where: { size },
      take: limit,
      skip: offset,
      orderBy: { [sortBy]: sortOrder },
    });

    return variants.map(mapRow);
  }

  async findByColor(
    color: string,
    options?: VariantQueryOptions,
  ): Promise<ProductVariant[]> {
    const {
      limit = 50,
      offset = 0,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = options || {};

    const variants = await this.prisma.productVariant.findMany({
      where: { color },
      take: limit,
      skip: offset,
      orderBy: { [sortBy]: sortOrder },
    });

    return variants.map(mapRow);
  }

  async findAvailableForBackorder(): Promise<ProductVariant[]> {
    const variants = await this.prisma.productVariant.findMany({
      where: { allowBackorder: true },
      orderBy: { createdAt: "desc" },
    });

    return variants.map(mapRow);
  }

  async findAvailableForPreorder(): Promise<ProductVariant[]> {
    const variants = await this.prisma.productVariant.findMany({
      where: { allowPreorder: true },
      orderBy: { createdAt: "desc" },
    });

    return variants.map(mapRow);
  }

  async update(variant: ProductVariant): Promise<void> {
    const data = variant.toDatabaseRow();

    await this.prisma.productVariant.update({
      where: { id: data.variant_id },
      data: {
        sku: data.sku,
        size: data.size,
        color: data.color,
        barcode: data.barcode,
        weightG: data.weight_g,
        dims: data.dims as any,
        taxClass: data.tax_class,
        allowBackorder: data.allow_backorder,
        allowPreorder: data.allow_preorder,
        restockEta: data.restock_eta,
        updatedAt: data.updated_at,
      },
    });
  }

  async delete(id: VariantId): Promise<void> {
    await this.prisma.productVariant.delete({
      where: { id: id.getValue() },
    });
  }

  async deleteByProductId(productId: ProductId): Promise<void> {
    await this.prisma.productVariant.deleteMany({
      where: { productId: productId.getValue() },
    });
  }

  async exists(id: VariantId): Promise<boolean> {
    const count = await this.prisma.productVariant.count({
      where: { id: id.getValue() },
    });
    return count > 0;
  }

  async existsBySku(sku: SKU): Promise<boolean> {
    const count = await this.prisma.productVariant.count({
      where: { sku: sku.getValue() },
    });
    return count > 0;
  }

  async count(options?: VariantCountOptions): Promise<number> {
    const whereClause: any = {};

    if (options?.productId) {
      whereClause.productId = options.productId;
    }

    if (options?.size) {
      whereClause.size = options.size;
    }

    if (options?.color) {
      whereClause.color = options.color;
    }

    if (options?.availableForBackorder !== undefined) {
      whereClause.allowBackorder = options.availableForBackorder;
    }

    if (options?.availableForPreorder !== undefined) {
      whereClause.allowPreorder = options.availableForPreorder;
    }

    return await this.prisma.productVariant.count({
      where: whereClause,
    });
  }
}
