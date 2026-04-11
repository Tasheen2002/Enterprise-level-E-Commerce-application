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

function mapRow(row: any): ProductVariant {
  return ProductVariant.fromPersistence({
    id: VariantId.fromString(row.id),
    productId: ProductId.fromString(row.productId),
    sku: SKU.fromString(row.sku),
    size: row.size,
    color: row.color,
    barcode: row.barcode,
    weightG: row.weightG,
    dims: row.dims as any,
    taxClass: row.taxClass,
    allowBackorder: row.allowBackorder,
    allowPreorder: row.allowPreorder,
    restockEta: row.restockEta,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  });
}

export class ProductVariantRepository implements IProductVariantRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(variant: ProductVariant): Promise<void> {
    await this.prisma.productVariant.create({
      data: {
        id: variant.id.getValue(),
        productId: variant.productId.getValue(),
        sku: variant.sku.getValue(),
        price: 0,
        size: variant.size,
        color: variant.color,
        barcode: variant.barcode,
        weightG: variant.weightG,
        dims: variant.dims as any,
        taxClass: variant.taxClass,
        allowBackorder: variant.allowBackorder,
        allowPreorder: variant.allowPreorder,
        restockEta: variant.restockEta,
        createdAt: variant.createdAt,
        updatedAt: variant.updatedAt,
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
    await this.prisma.productVariant.update({
      where: { id: variant.id.getValue() },
      data: {
        sku: variant.sku.getValue(),
        size: variant.size,
        color: variant.color,
        barcode: variant.barcode,
        weightG: variant.weightG,
        dims: variant.dims as any,
        taxClass: variant.taxClass,
        allowBackorder: variant.allowBackorder,
        allowPreorder: variant.allowPreorder,
        restockEta: variant.restockEta,
        updatedAt: variant.updatedAt,
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
