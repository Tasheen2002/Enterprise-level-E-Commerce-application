import { PrismaClient } from "@prisma/client";
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
import { Price } from "../../../domain/value-objects/price.vo";

export class ProductRepositoryImpl implements IProductRepository {
  constructor(private readonly prisma: PrismaClient) {}

  private mapRow(row: any): Product {
    const slug = row.slug ? Slug.fromString(row.slug) : Slug.create(row.title);
    return Product.fromPersistence({
      id: ProductId.fromString(row.id),
      title: row.title,
      slug,
      brand: row.brand,
      shortDesc: row.shortDesc,
      longDescHtml: row.longDescHtml,
      status: row.status as any,
      publishAt: row.publishAt,
      countryOfOrigin: row.countryOfOrigin,
      seoTitle: row.seoTitle,
      seoDescription: row.seoDescription,
      price: Price.create(parseFloat(row.price?.toString() ?? "0")),
      priceSgd: row.priceSgd ? Price.create(parseFloat(row.priceSgd.toString())) : null,
      priceUsd: row.priceUsd ? Price.create(parseFloat(row.priceUsd.toString())) : null,
      compareAtPrice: row.compareAtPrice ? Price.create(parseFloat(row.compareAtPrice.toString())) : null,
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
      status: product.status as any,
      publishAt: product.publishAt,
      countryOfOrigin: product.countryOfOrigin,
      seoTitle: product.seoTitle,
      seoDescription: product.seoDescription,
      updatedAt: product.updatedAt,
    };
    await this.prisma.product.upsert({
      where: { id: product.id.getValue() },
      create: {
        id: product.id.getValue(),
        price: product.price.getValue(),
        priceSgd: product.priceSgd?.getValue() ?? null,
        priceUsd: product.priceUsd?.getValue() ?? null,
        compareAtPrice: product.compareAtPrice?.getValue() ?? null,
        createdAt: product.createdAt,
        ...updateData,
      },
      update: updateData,
    });
  }

  async saveWithCategories(
    product: Product,
    categoryIds: string[],
  ): Promise<void> {
    const productId = product.id.getValue();

    // Use transaction to ensure atomicity
    await this.prisma.$transaction(async (tx) => {
      // Create product
      await tx.product.create({
        data: {
          id: productId,
          title: product.title,
          slug: product.slug.getValue(),
          brand: product.brand,
          shortDesc: product.shortDesc,
          longDescHtml: product.longDescHtml,
          status: product.status as any,
          publishAt: product.publishAt,
          countryOfOrigin: product.countryOfOrigin,
          seoTitle: product.seoTitle,
          seoDescription: product.seoDescription,
          price: product.price.getValue(),
          priceSgd: product.priceSgd?.getValue() ?? null,
          priceUsd: product.priceUsd?.getValue() ?? null,
          compareAtPrice: product.compareAtPrice?.getValue() ?? null,
          createdAt: product.createdAt,
          updatedAt: product.updatedAt,
        },
      });

      // Create category associations
      if (categoryIds.length > 0) {
        await tx.productCategory.createMany({
          data: categoryIds.map((categoryId) => ({
            productId,
            categoryId,
          })),
        });
      }
    });
  }

  async findById(id: ProductId): Promise<Product | null> {
    const productData = await this.prisma.product.findUnique({
      where: { id: id.getValue() },
    });

    if (!productData) {
      return null;
    }

    return this.mapRow(productData);
  }

  async findBySlug(slug: Slug): Promise<Product | null> {
    const productData = await this.prisma.product.findUnique({
      where: { slug: slug.getValue() },
    });

    if (!productData) {
      return null;
    }

    return this.mapRow(productData);
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

    const whereClause: any = {};
    if (brand) {
      whereClause.brand = brand;
    }
    if (categoryId) {
      whereClause.categories = { some: { categoryId } };
    }
    if (status) {
      whereClause.status = status;
    } else if (!includeDrafts) {
      whereClause.status = { in: ["published", "scheduled"] };
    } else {
      whereClause.status = {
        in: ["draft", "published", "scheduled", "archived"],
      };
    }

    const products = await this.prisma.product.findMany({
      where: whereClause,
      take: limit,
      skip: offset,
      orderBy: { [sortBy]: sortOrder },
      include: {
        variants: true,
        media: {
          include: {
            asset: true,
          },
        },
        categories: {
          include: {
            category: true,
          },
        },
      },
    });

    return products.map((p) => this.mapRow(p));
  }

  async findByStatus(
    status: string,
    options?: ProductQueryOptions,
  ): Promise<Product[]> {
    const {
      limit = 50,
      offset = 0,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = options || {};

    const products = await this.prisma.product.findMany({
      where: { status: status as any },
      take: limit,
      skip: offset,
      orderBy: { [sortBy]: sortOrder },
    });

    return products.map((p) => this.mapRow(p));
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

    const whereClause: any = { brand };
    if (!includeDrafts) {
      whereClause.status = { in: ["published", "scheduled"] };
    }

    const products = await this.prisma.product.findMany({
      where: whereClause,
      take: limit,
      skip: offset,
      orderBy: { [sortBy]: sortOrder },
    });

    return products.map((p) => this.mapRow(p));
  }

  async findByCategory(
    categoryId: string,
    options?: ProductQueryOptions,
  ): Promise<Product[]> {
    const {
      limit = 50,
      offset = 0,
      sortBy = "createdAt",
      sortOrder = "desc",
      includeDrafts = false,
    } = options || {};

    const whereClause: any = {
      categories: { some: { categoryId: categoryId } },
    };

    if (!includeDrafts) {
      whereClause.status = { in: ["published", "scheduled"] };
    }

    const products = await this.prisma.product.findMany({
      where: whereClause,
      take: limit,
      skip: offset,
      orderBy: { [sortBy]: sortOrder },
    });

    return products.map((p) => this.mapRow(p));
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

    const whereClause: any = {
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
      whereClause.status = { in: ["published", "scheduled"] };
    }

    if (brands && brands.length > 0) {
      whereClause.brand = { in: brands };
    }

    if (categories && categories.length > 0) {
      whereClause.categories = {
        some: {
          categoryId: { in: categories },
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

    return products.map((p) => this.mapRow(p));
  }


  async delete(id: ProductId): Promise<void> {
    await this.prisma.product.update({
      where: { id: id.getValue() },
      data: { status: "archived" as any },
    });
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
    const whereClause: any = {};

    if (options?.status) {
      whereClause.status = options.status;
    }

    if (options?.brand) {
      whereClause.brand = options.brand;
    }

    if (options?.categoryId) {
      whereClause.categories = {
        some: {
          categoryId: options.categoryId,
        },
      };
    }

    return await this.prisma.product.count({
      where: whereClause,
    });
  }

  async addToCategory(productId: string, categoryId: string): Promise<void> {
    await this.prisma.productCategory.create({
      data: {
        productId,
        categoryId,
      },
    });
  }

  async replaceCategories(
    productId: string,
    categoryIds: string[],
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await tx.productCategory.deleteMany({ where: { productId } });
      if (categoryIds.length > 0) {
        await tx.productCategory.createMany({
          data: categoryIds.map((categoryId) => ({ productId, categoryId })),
        });
      }
    });
  }

  async findWithEnrichment(
    ids: string[],
  ): Promise<Map<string, ProductEnrichment>> {
    const enrichedProducts = await this.prisma.product.findMany({
      where: { id: { in: ids } },
      include: {
        variants: {
          orderBy: { createdAt: "asc" },
          take: 10,
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

  async findOneWithEnrichment(id: string): Promise<ProductEnrichment> {
    const enrichedProduct = await this.prisma.product.findUnique({
      where: { id },
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
      return { variants: [], images: [], categories: [] };
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

  async findMediaEnrichment(id: string): Promise<ProductMediaEnrichment> {
    const enrichedProduct = await this.prisma.product.findUnique({
      where: { id },
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
            bytes: m.asset.bytes ? m.asset.bytes.toString() : null,
            mime: m.asset.mime,
          },
        })) || [],
    };
  }
}
