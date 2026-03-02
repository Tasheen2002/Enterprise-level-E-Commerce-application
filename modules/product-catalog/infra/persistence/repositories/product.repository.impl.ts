import { PrismaClient } from "@prisma/client";
import {
  IProductRepository,
  ProductQueryOptions,
  ProductSearchOptions,
  ProductCountOptions,
} from "../../../domain/repositories/product.repository";
import { Product } from "../../../domain/entities/product.entity";
import { ProductId } from "../../../domain/value-objects/product-id.vo";
import { Slug } from "../../../domain/value-objects/slug.vo";

function mapRow(productData: any): Product {
  return Product.fromDatabaseRow({
    product_id: productData.id,
    title: productData.title,
    slug: productData.slug,
    brand: productData.brand,
    short_desc: productData.shortDesc,
    long_desc_html: productData.longDescHtml,
    status: productData.status as any,
    publish_at: productData.publishAt,
    country_of_origin: productData.countryOfOrigin,
    seo_title: productData.seoTitle,
    seo_description: productData.seoDescription,
    price: productData.price?.toString() ?? "0",
    price_sgd: productData.priceSgd?.toString() ?? null,
    price_usd: productData.priceUsd?.toString() ?? null,
    compare_at_price: productData.compareAtPrice?.toString() ?? null,
    created_at: productData.createdAt,
    updated_at: productData.updatedAt,
  });
}

export class ProductRepository implements IProductRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(product: Product): Promise<void> {
    const data = product.toDatabaseRow();

    await this.prisma.product.create({
      data: {
        id: data.product_id,
        title: data.title,
        slug: data.slug,
        brand: data.brand,
        shortDesc: data.short_desc,
        longDescHtml: data.long_desc_html,
        status: data.status as any,
        publishAt: data.publish_at,
        countryOfOrigin: data.country_of_origin,
        seoTitle: data.seo_title,
        seoDescription: data.seo_description,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      },
    });
  }

  async saveWithCategories(
    product: Product,
    categoryIds: string[],
  ): Promise<void> {
    const data = product.toDatabaseRow();

    // Use transaction to ensure atomicity
    await this.prisma.$transaction(async (tx) => {
      // Create product
      await tx.product.create({
        data: {
          id: data.product_id,
          title: data.title,
          slug: data.slug,
          brand: data.brand,
          shortDesc: data.short_desc,
          longDescHtml: data.long_desc_html,
          status: data.status as any,
          publishAt: data.publish_at,
          countryOfOrigin: data.country_of_origin,
          seoTitle: data.seo_title,
          seoDescription: data.seo_description,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        },
      });

      // Create category associations
      if (categoryIds.length > 0) {
        await tx.productCategory.createMany({
          data: categoryIds.map((categoryId) => ({
            productId: data.product_id,
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

    return mapRow(productData);
  }

  async findBySlug(slug: Slug): Promise<Product | null> {
    const productData = await this.prisma.product.findUnique({
      where: { slug: slug.getValue() },
    });

    if (!productData) {
      return null;
    }

    return mapRow(productData);
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

    return products.map((p) => mapRow(p));
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

    return products.map((p) => mapRow(p));
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

    return products.map((p) => mapRow(p));
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

    return products.map((p) => mapRow(p));
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

    return products.map((p) => mapRow(p));
  }

  async update(product: Product): Promise<void> {
    const data = product.toDatabaseRow();

    await this.prisma.product.update({
      where: { id: data.product_id },
      data: {
        title: data.title,
        slug: data.slug,
        brand: data.brand,
        shortDesc: data.short_desc,
        longDescHtml: data.long_desc_html,
        status: data.status as any,
        publishAt: data.publish_at,
        countryOfOrigin: data.country_of_origin,
        seoTitle: data.seo_title,
        seoDescription: data.seo_description,
        updatedAt: data.updated_at,
      },
    });
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
}
