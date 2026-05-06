import { PrismaClient, Prisma, ProductStatusEnum } from "@prisma/client";
import {
  IProductRepository,
  ProductQueryOptions,
  ProductSearchOptions,
  ProductCountOptions,
  ProductEnrichment,
  ProductMediaEnrichment,
} from "../../../domain/repositories/product.repository";
import { Product } from "../../../domain/entities/product.entity";
import { ProductId } from "../../../domain/value-objects/product-id.vo";
import { Slug } from "../../../domain/value-objects/slug.vo";
import { CategoryId } from "../../../domain/value-objects/category-id.vo";
import { Money } from "../../../domain/value-objects/money.vo";
import { ProductStatus } from "../../../domain/value-objects";
import { DEFAULT_CURRENCY } from "../../../../../packages/core/src/domain/value-objects/currency.constants";
import { PrismaRepository } from "../../../../../apps/api/src/shared/infrastructure/persistence/prisma-repository.base";
import { IEventBus } from "../../../../../packages/core/src/domain/events/domain-event";

type ProductRow = Prisma.ProductGetPayload<object>;

const PUBLIC_STATUSES: ProductStatusEnum[] = [
  ProductStatusEnum.published,
  ProductStatusEnum.scheduled,
];

const ALL_STATUSES: ProductStatusEnum[] = [
  ProductStatusEnum.draft,
  ProductStatusEnum.published,
  ProductStatusEnum.scheduled,
  ProductStatusEnum.archived,
];

export class ProductRepositoryImpl
  extends PrismaRepository<Product>
  implements IProductRepository
{
  constructor(prisma: PrismaClient, eventBus?: IEventBus) {
    super(prisma, eventBus);
  }

  private mapStatusFromPrisma(status: ProductStatusEnum): ProductStatus {
    switch (status) {
      case ProductStatusEnum.draft:
        return ProductStatus.DRAFT;
      case ProductStatusEnum.published:
        return ProductStatus.PUBLISHED;
      case ProductStatusEnum.scheduled:
        return ProductStatus.SCHEDULED;
      case ProductStatusEnum.archived:
        return ProductStatus.ARCHIVED;
      default: {
        const _exhaustive: never = status;
        throw new Error(`Unknown ProductStatusEnum value: ${_exhaustive}`);
      }
    }
  }

  private mapStatusToPrisma(status: ProductStatus): ProductStatusEnum {
    switch (status) {
      case ProductStatus.DRAFT:
        return ProductStatusEnum.draft;
      case ProductStatus.PUBLISHED:
        return ProductStatusEnum.published;
      case ProductStatus.SCHEDULED:
        return ProductStatusEnum.scheduled;
      case ProductStatus.ARCHIVED:
        return ProductStatusEnum.archived;
      default: {
        const _exhaustive: never = status;
        throw new Error(`Unknown ProductStatus value: ${_exhaustive}`);
      }
    }
  }

  private toDomain(row: ProductRow): Product {
    const slug = row.slug ? Slug.fromString(row.slug) : Slug.create(row.title);
    // Base price currency: read row.currency if the schema has it, otherwise fall back
    // to DEFAULT_CURRENCY. priceSgd/priceUsd carry their currency by column convention.
    const baseCurrency = row.currency ?? DEFAULT_CURRENCY;
    return Product.fromPersistence({
      id: ProductId.fromString(row.id),
      title: row.title,
      slug,
      brand: row.brand,
      shortDesc: row.shortDesc,
      longDescHtml: row.longDescHtml,
      status: this.mapStatusFromPrisma(row.status),
      publishAt: row.publishAt,
      countryOfOrigin: row.countryOfOrigin,
      seoTitle: row.seoTitle,
      seoDescription: row.seoDescription,
      price: Money.fromPersistence(parseFloat(row.price.toString()), baseCurrency),
      priceSgd: row.priceSgd
        ? Money.fromPersistence(parseFloat(row.priceSgd.toString()), "SGD")
        : null,
      priceUsd: row.priceUsd
        ? Money.fromPersistence(parseFloat(row.priceUsd.toString()), "USD")
        : null,
      compareAtPrice: row.compareAtPrice
        ? Money.fromPersistence(parseFloat(row.compareAtPrice.toString()), baseCurrency)
        : null,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  async save(product: Product): Promise<void> {
    const updateData = {
      title: product.title,
      slug: product.slug.getValue(),
      brand: product.brand,
      shortDesc: product.shortDesc,
      longDescHtml: product.longDescHtml,
      status: this.mapStatusToPrisma(product.status),
      publishAt: product.publishAt,
      countryOfOrigin: product.countryOfOrigin,
      seoTitle: product.seoTitle,
      seoDescription: product.seoDescription,
      price: product.price.getAmount(),
      priceSgd: product.priceSgd?.getAmount() ?? null,
      priceUsd: product.priceUsd?.getAmount() ?? null,
      compareAtPrice: product.compareAtPrice?.getAmount() ?? null,
      updatedAt: product.updatedAt,
    };
    await this.prisma.product.upsert({
      where: { id: product.id.getValue() },
      create: {
        id: product.id.getValue(),
        createdAt: product.createdAt,
        ...updateData,
      },
      update: updateData,
    });
    await this.dispatchEvents(product);
  }

  async findById(id: ProductId): Promise<Product | null> {
    const productData = await this.prisma.product.findUnique({
      where: { id: id.getValue() },
    });

    if (!productData) {
      return null;
    }

    return this.toDomain(productData);
  }

  async findByIds(ids: ProductId[]): Promise<Product[]> {
    if (ids.length === 0) return [];
    const rows = await this.prisma.product.findMany({
      where: { id: { in: ids.map((id) => id.getValue()) } },
    });
    return rows.map((r) => this.toDomain(r));
  }

  async findBySlug(slug: Slug): Promise<Product | null> {
    const productData = await this.prisma.product.findUnique({
      where: { slug: slug.getValue() },
    });

    if (!productData) {
      return null;
    }

    return this.toDomain(productData);
  }

  async findAll(options?: ProductQueryOptions): Promise<Product[]> {
    const {
      limit = 50,
      offset = 0,
      sortBy = "createdAt",
      sortOrder = "desc",
      includeDrafts = false,
      brand,
      categoryId,
      status,
    } = options || {};

    const whereClause: Record<string, unknown> = {};
    if (brand) {
      whereClause.brand = brand;
    }
    if (categoryId) {
      whereClause.categories = { some: { categoryId: categoryId.getValue() } };
    }
    if (status) {
      whereClause.status = status;
    } else if (!includeDrafts) {
      whereClause.status = { in: PUBLIC_STATUSES };
    } else {
      whereClause.status = { in: ALL_STATUSES };
    }

    const products = await this.prisma.product.findMany({
      where: whereClause,
      take: limit,
      skip: offset,
      orderBy: { [sortBy]: sortOrder },
    });

    return products.map((p) => this.toDomain(p));
  }

  async findByStatus(
    status: ProductStatus,
    options?: ProductQueryOptions,
  ): Promise<Product[]> {
    const {
      limit = 50,
      offset = 0,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = options || {};

    const products = await this.prisma.product.findMany({
      where: { status: this.mapStatusToPrisma(status) },
      take: limit,
      skip: offset,
      orderBy: { [sortBy]: sortOrder },
    });

    return products.map((p) => this.toDomain(p));
  }

  async findByBrand(
    brand: string,
    options?: ProductQueryOptions,
  ): Promise<Product[]> {
    const {
      limit = 50,
      offset = 0,
      sortBy = "createdAt",
      sortOrder = "desc",
      includeDrafts = false,
    } = options || {};

    const whereClause: Record<string, unknown> = { brand };
    if (!includeDrafts) {
      whereClause.status = { in: PUBLIC_STATUSES };
    }

    const products = await this.prisma.product.findMany({
      where: whereClause,
      take: limit,
      skip: offset,
      orderBy: { [sortBy]: sortOrder },
    });

    return products.map((p) => this.toDomain(p));
  }

  async findByCategory(
    categoryId: CategoryId,
    options?: ProductQueryOptions,
  ): Promise<Product[]> {
    const {
      limit = 50,
      offset = 0,
      sortBy = "createdAt",
      sortOrder = "desc",
      includeDrafts = false,
    } = options || {};

    const whereClause: Record<string, unknown> = {
      categories: { some: { categoryId: categoryId.getValue() } },
    };

    if (!includeDrafts) {
      whereClause.status = { in: PUBLIC_STATUSES };
    }

    const products = await this.prisma.product.findMany({
      where: whereClause,
      take: limit,
      skip: offset,
      orderBy: { [sortBy]: sortOrder },
    });

    return products.map((p) => this.toDomain(p));
  }

  async search(
    query: string,
    options?: ProductSearchOptions,
  ): Promise<Product[]> {
    const {
      limit = 50,
      offset = 0,
      sortBy = "createdAt",
      sortOrder = "desc",
      includeDrafts = false,
      brands,
      categories,
      tags,
      priceRange,
    } = options || {};

    const whereClause: Record<string, unknown> = {
      OR: [
        {
          title: {
            contains: query,
            mode: "insensitive",
          },
        },
        {
          shortDesc: {
            contains: query,
            mode: "insensitive",
          },
        },
        {
          brand: {
            contains: query,
            mode: "insensitive",
          },
        },
      ],
    };

    if (!includeDrafts) {
      whereClause.status = { in: PUBLIC_STATUSES };
    }

    if (brands && brands.length > 0) {
      whereClause.brand = { in: brands };
    }

    if (categories && categories.length > 0) {
      whereClause.categories = {
        some: {
          categoryId: { in: categories.map((c) => c.getValue()) },
        },
      };
    }

    if (tags && tags.length > 0) {
      whereClause.tags = {
        some: {
          tag: {
            tag: { in: tags },
          },
        },
      };
    }

    if (priceRange) {
      whereClause.price = {
        gte: priceRange.min,
        lte: priceRange.max,
      };
    }

    const products = await this.prisma.product.findMany({
      where: whereClause,
      take: limit,
      skip: offset,
      orderBy: { [sortBy]: sortOrder },
    });

    return products.map((p) => this.toDomain(p));
  }

  // Soft delete via the aggregate's `archive()` method so ProductArchivedEvent fires.
  // Idempotent — silently no-ops when the product does not exist.
  async delete(id: ProductId): Promise<void> {
    const product = await this.findById(id);
    if (!product) return;
    product.archive();
    await this.save(product);
  }

  async exists(id: ProductId): Promise<boolean> {
    const count = await this.prisma.product.count({
      where: { id: id.getValue() },
    });
    return count > 0;
  }

  async existsBySlug(slug: Slug): Promise<boolean> {
    const count = await this.prisma.product.count({
      where: { slug: slug.getValue() },
    });
    return count > 0;
  }

  async count(options?: ProductCountOptions): Promise<number> {
    const whereClause: Record<string, unknown> = {};

    if (options?.status) {
      whereClause.status = this.mapStatusToPrisma(options.status);
    }

    if (options?.brand) {
      whereClause.brand = options.brand;
    }

    if (options?.categoryId) {
      whereClause.categories = {
        some: {
          categoryId: options.categoryId.getValue(),
        },
      };
    }

    return await this.prisma.product.count({
      where: whereClause,
    });
  }

  async replaceCategories(
    productId: ProductId,
    categoryIds: CategoryId[],
  ): Promise<void> {
    const pid = productId.getValue();
    await this.prisma.$transaction(async (tx) => {
      await tx.productCategory.deleteMany({ where: { productId: pid } });
      if (categoryIds.length > 0) {
        await tx.productCategory.createMany({
          data: categoryIds.map((cid) => ({
            productId: pid,
            categoryId: cid.getValue(),
          })),
        });
      }
    });
  }

  async findWithEnrichment(
    ids: ProductId[],
  ): Promise<Map<string, ProductEnrichment>> {
    const idValues = ids.map((id) => id.getValue());
    const enrichedProducts = await this.prisma.product.findMany({
      where: { id: { in: idValues } },
      include: {
        variants: {
          orderBy: { createdAt: "asc" },
          take: 10, // preview cap — products with >10 variants are silently truncated here
          include: { inventoryStocks: true },
        },
        media: {
          include: { asset: true },
          orderBy: { position: "asc" },
        },
        categories: {
          include: { category: true },
        },
      },
    });

    const enrichmentMap = new Map<string, ProductEnrichment>();

    for (const product of enrichedProducts) {
      enrichmentMap.set(product.id, {
        variants:
          product.variants?.map((v: any) => {
            const totalInventory =
              v.inventoryStocks?.reduce(
                (sum: number, stock: any) =>
                  sum + (stock.onHand - stock.reserved),
                0,
              ) || 0;
            return {
              id: v.id,
              sku: v.sku,
              size: v.size,
              color: v.color,
              inventory: totalInventory,
            };
          }) || [],
        images:
          product.media?.map((m: any) => ({
            url: m.asset.storageKey,
            alt: m.asset.altText,
            width: m.asset.width,
            height: m.asset.height,
          })) || [],
        categories:
          product.categories?.map((pc: any) => ({
            id: pc.category.id,
            name: pc.category.name,
            slug: pc.category.slug,
            position: pc.category.position,
          })) || [],
      });
    }

    return enrichmentMap;
  }

  async findOneWithEnrichment(id: ProductId): Promise<ProductEnrichment | null> {
    const enrichedProduct = await this.prisma.product.findUnique({
      where: { id: id.getValue() },
      include: {
        variants: {
          orderBy: { createdAt: "asc" },
          include: { inventoryStocks: true },
        },
        media: {
          include: { asset: true },
          orderBy: { position: "asc" },
        },
        categories: {
          include: { category: true },
        },
      },
    });

    if (!enrichedProduct) {
      return null;
    }

    return {
      variants:
        enrichedProduct.variants?.map((v: any) => {
          const totalInventory =
            v.inventoryStocks?.reduce(
              (sum: number, stock: any) =>
                sum + (stock.onHand - stock.reserved),
              0,
            ) || 0;
          return {
            id: v.id,
            sku: v.sku,
            size: v.size,
            color: v.color,
            inventory: totalInventory,
          };
        }) || [],
      images:
        enrichedProduct.media?.map((m: any) => ({
          url: m.asset.storageKey,
          alt: m.asset.altText,
          width: m.asset.width,
          height: m.asset.height,
        })) || [],
      categories:
        enrichedProduct.categories?.map((pc: any) => ({
          id: pc.category.id,
          name: pc.category.name,
          slug: pc.category.slug,
          position: pc.category.position,
        })) || [],
    };
  }

  async findMediaEnrichment(id: ProductId): Promise<ProductMediaEnrichment> {
    const enrichedProduct = await this.prisma.product.findUnique({
      where: { id: id.getValue() },
      include: {
        media: {
          include: { asset: true },
          orderBy: { position: "asc" },
        },
      },
    });

    return {
      images:
        enrichedProduct?.media?.map((m: any) => ({
          url: m.asset.storageKey,
          alt: m.asset.altText,
          width: m.asset.width,
          height: m.asset.height,
        })) || [],
      media:
        enrichedProduct?.media?.map((m: any) => ({
          id: m.id,
          productId: m.productId,
          assetId: m.assetId,
          position: m.position,
          asset: {
            id: m.asset.id,
            storageKey: m.asset.storageKey,
            altText: m.asset.altText,
            width: m.asset.width,
            height: m.asset.height,
            bytes: m.asset.bytes != null ? Number(m.asset.bytes) : null,
            mime: m.asset.mime,
          },
        })) || [],
    };
  }
}
