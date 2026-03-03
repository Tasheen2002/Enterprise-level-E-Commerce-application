import { FastifyRequest, FastifyReply } from "fastify";
import {
  CreateProductCommand,
  CreateProductHandler,
  UpdateProductCommand,
  UpdateProductHandler,
  DeleteProductCommand,
  DeleteProductHandler,
  GetProductQuery,
  GetProductHandler,
  ListProductsQuery,
  ListProductsHandler,
  SearchProductsQuery,
  SearchProductsHandler,
} from "../../../application";
import { ProductManagementService } from "../../../application/services/product-management.service";
import { ProductSearchService } from "../../../application/services/product-search.service";
import { PrismaClient } from "@prisma/client";
import { ResponseHelper } from "@/api/src/shared/response.helper";

interface CreateProductRequest {
  title: string;
  brand?: string;
  shortDesc?: string;
  longDescHtml?: string;
  status?: "draft" | "published" | "scheduled";
  publishAt?: string;
  countryOfOrigin?: string;
  seoTitle?: string;
  seoDescription?: string;
  price?: number;
  priceSgd?: number;
  priceUsd?: number;
  compareAtPrice?: number;
  categoryIds?: string[];
  tags?: string[];
}

interface UpdateProductRequest extends Partial<CreateProductRequest> {}

interface ProductQueryParams {
  page?: number;
  limit?: number;
  status?: "draft" | "published" | "scheduled" | "archived";
  brand?: string;
  categoryId?: string;
  search?: string;
  includeDrafts?: boolean;
  sortBy?: "createdAt" | "title" | "publishAt";
  sortOrder?: "asc" | "desc";
}

export class ProductController {
  private createProductHandler: CreateProductHandler;
  private updateProductHandler: UpdateProductHandler;
  private deleteProductHandler: DeleteProductHandler;
  private getProductHandler: GetProductHandler;
  private listProductsHandler: ListProductsHandler;
  private searchProductsHandler: SearchProductsHandler;

  constructor(
    private readonly productManagementService: ProductManagementService,
    private readonly productSearchService: ProductSearchService,
    private readonly prisma: PrismaClient,
  ) {
    this.createProductHandler = new CreateProductHandler(productManagementService);
    this.updateProductHandler = new UpdateProductHandler(productManagementService);
    this.deleteProductHandler = new DeleteProductHandler(productManagementService);
    this.getProductHandler = new GetProductHandler(productManagementService);
    this.listProductsHandler = new ListProductsHandler(productManagementService);
    this.searchProductsHandler = new SearchProductsHandler(productSearchService);
  }

  async listProducts(
    request: FastifyRequest<{ Querystring: ProductQueryParams }>,
    reply: FastifyReply,
  ) {
    try {
      const {
        page = 1,
        limit = 20,
        status,
        brand,
        categoryId,
        search,
        includeDrafts = false,
        sortBy = "createdAt",
        sortOrder = "desc",
      } = request.query;

      let products: any[] = [];
      let totalCount = 0;
      const currentPage = Math.max(1, page);
      const currentLimit = Math.min(100, Math.max(1, limit));

      if (search) {
        const searchQuery: SearchProductsQuery = {
          searchTerm: search,
          page: currentPage,
          limit: currentLimit,
          categoryId,
          brand,
          status,
          sortBy:
            sortBy === "createdAt" || sortBy === "title" || sortBy === "publishAt"
              ? sortBy
              : "relevance",
          sortOrder,
        };

        const searchResult = await this.searchProductsHandler.handle(searchQuery);
        if (searchResult.success && searchResult.data) {
          products = searchResult.data.products;
          totalCount = searchResult.data.totalCount;
        } else {
          return ResponseHelper.error(reply, new Error(searchResult.error ?? "Search failed"));
        }
      } else {
        const query: ListProductsQuery = {
          page: currentPage,
          limit: currentLimit,
          status,
          brand,
          categoryId,
          includeDrafts,
          sortBy,
          sortOrder,
        };

        const result = await this.listProductsHandler.handle(query);
        if (result.success && result.data) {
          products = result.data.products;
          totalCount = result.data.totalCount;
        } else {
          return ResponseHelper.error(reply, new Error(result.error ?? "Failed to list products"));
        }
      }

      const normalizedProducts = products.map((p) => {
        if (typeof p.getId === "function") {
          return p.toData();
        }
        return p;
      });

      const productIds = normalizedProducts.map(
        (p) => p.id || p.productId || p.product_id,
      );

      const enrichedProducts = await this.prisma.product.findMany({
        where: { id: { in: productIds } },
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

      const productsWithDetails = normalizedProducts.map((product) => {
        const pId = product.id || product.productId || product.product_id;
        const enriched = enrichedProducts.find((p) => p.id === pId);

        return {
          productId: pId,
          title: product.title,
          slug: product.slug,
          brand: product.brand,
          shortDesc: product.shortDesc || product.short_desc,
          longDescHtml: product.longDescHtml || product.long_desc_html,
          status: product.status,
          publishAt: product.publishAt || product.publish_at,
          countryOfOrigin: product.countryOfOrigin || product.country_of_origin,
          seoTitle: product.seoTitle || product.seo_title,
          seoDescription: product.seoDescription || product.seo_description,
          price: product.price,
          priceSgd: product.priceSgd,
          priceUsd: product.priceUsd,
          compareAtPrice: product.compareAtPrice,
          createdAt: product.createdAt || product.created_at,
          updatedAt: product.updatedAt || product.updated_at,
          variants:
            enriched?.variants?.map((v) => {
              const totalInventory =
                v.inventoryStocks?.reduce((sum, stock) => {
                  return sum + (stock.onHand - stock.reserved);
                }, 0) || 0;
              return { id: v.id, sku: v.sku, size: v.size, color: v.color, inventory: totalInventory };
            }) || [],
          images:
            enriched?.media?.map((m) => ({
              url: m.asset.storageKey,
              alt: m.asset.altText,
              width: m.asset.width,
              height: m.asset.height,
            })) || [],
          categories:
            enriched?.categories?.map((pc) => ({
              id: pc.category.id,
              name: pc.category.name,
              slug: pc.category.slug,
              position: pc.category.position,
            })) || [],
        };
      });

      return ResponseHelper.ok(reply, "Products retrieved successfully", {
        products: productsWithDetails,
        total: totalCount,
        page: currentPage,
        limit: currentLimit,
      });
    } catch (error) {
      request.log.error(error, "Failed to list/search products");
      return ResponseHelper.error(reply, error);
    }
  }

  async getProduct(
    request: FastifyRequest<{ Params: { productId: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const { productId } = request.params;

      const query: GetProductQuery = { productId };
      const result = await this.getProductHandler.handle(query);

      if (result.success && result.data) {
        const enrichedProduct = await this.prisma.product.findUnique({
          where: { id: productId },
          include: {
            media: {
              include: { asset: true },
              orderBy: { position: "asc" },
            },
          },
        });

        const mappedImages =
          enrichedProduct?.media?.map((m) => ({
            url: m.asset.storageKey,
            alt: m.asset.altText,
            width: m.asset.width,
            height: m.asset.height,
          })) || [];

        const productWithDetails = {
          ...result.data,
          slug: result.data?.slug || enrichedProduct?.slug || "",
          images: mappedImages,
          media:
            enrichedProduct?.media?.map((m) => ({
              ...m,
              asset: {
                ...m.asset,
                bytes: m.asset.bytes ? m.asset.bytes.toString() : null,
              },
            })) || [],
        };

        return ResponseHelper.ok(reply, "Product retrieved successfully", productWithDetails);
      } else {
        return ResponseHelper.notFound(reply, result.error ?? "Product not found");
      }
    } catch (error) {
      request.log.error(error, "Failed to get product");
      return ResponseHelper.error(reply, error);
    }
  }

  async getProductBySlug(
    request: FastifyRequest<{ Params: { slug: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const { slug } = request.params;

      const query: GetProductQuery = { slug };
      const result = await this.getProductHandler.handle(query);

      if (result.success && result.data) {
        const enrichedProduct = (await this.prisma.product.findUnique({
          where: { id: result.data.productId },
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
        })) as any;

        const mappedImages =
          enrichedProduct?.media?.map((m: any) => ({
            url: m.asset.storageKey,
            alt: m.asset.altText,
            width: m.asset.width,
            height: m.asset.height,
          })) || [];

        const productWithDetails = {
          ...result.data,
          variants:
            enrichedProduct?.variants?.map((v: any) => {
              const totalInventory =
                v.inventoryStocks?.reduce((sum: number, stock: any) => {
                  return sum + (stock.onHand - stock.reserved);
                }, 0) || 0;
              return { id: v.id, sku: v.sku, size: v.size, color: v.color, inventory: totalInventory };
            }) || [],
          images: mappedImages,
          categories:
            enrichedProduct?.categories?.map((pc: any) => ({
              id: pc.category.id,
              name: pc.category.name,
              slug: pc.category.slug,
              position: pc.category.position,
            })) || [],
        };

        return ResponseHelper.ok(reply, "Product retrieved successfully", productWithDetails);
      } else {
        return ResponseHelper.notFound(reply, result.error ?? "Product not found");
      }
    } catch (error) {
      request.log.error(error, "Failed to get product by slug");
      return ResponseHelper.error(reply, error);
    }
  }

  async createProduct(
    request: FastifyRequest<{ Body: CreateProductRequest }>,
    reply: FastifyReply,
  ) {
    try {
      const productData = request.body;

      const command: CreateProductCommand = {
        title: productData.title,
        brand: productData.brand,
        shortDesc: productData.shortDesc,
        longDescHtml: productData.longDescHtml,
        status: productData.status as any,
        publishAt: productData.publishAt ? new Date(productData.publishAt) : undefined,
        countryOfOrigin: productData.countryOfOrigin,
        seoTitle: productData.seoTitle,
        seoDescription: productData.seoDescription,
        price: productData.price,
        priceSgd: productData.priceSgd,
        priceUsd: productData.priceUsd,
        compareAtPrice: productData.compareAtPrice,
        categoryIds: productData.categoryIds,
        tags: productData.tags,
      };

      const result = await this.createProductHandler.handle(command);

      if (result.success && result.data) {
        const data = result.data.toData();
        return ResponseHelper.created(reply, "Product created successfully", {
          productId: data.id,
          title: data.title,
          slug: data.slug,
          status: data.status,
          createdAt: new Date().toISOString(),
        });
      }

      return ResponseHelper.fromCommand(reply, result, "Product created successfully", 201);
    } catch (error) {
      request.log.error(error, "Failed to create product");
      return ResponseHelper.error(reply, error);
    }
  }

  async updateProduct(
    request: FastifyRequest<{
      Params: { productId: string };
      Body: UpdateProductRequest;
    }>,
    reply: FastifyReply,
  ) {
    try {
      const { productId: id } = request.params;
      const updateData = request.body;

      const command: UpdateProductCommand = {
        productId: id,
        title: updateData.title,
        brand: updateData.brand,
        shortDesc: updateData.shortDesc,
        longDescHtml: updateData.longDescHtml,
        status: updateData.status as any,
        publishAt: updateData.publishAt ? new Date(updateData.publishAt) : undefined,
        countryOfOrigin: updateData.countryOfOrigin,
        seoTitle: updateData.seoTitle,
        seoDescription: updateData.seoDescription,
        price: updateData.price,
        priceSgd: updateData.priceSgd,
        priceUsd: updateData.priceUsd,
        compareAtPrice: updateData.compareAtPrice,
        categoryIds: updateData.categoryIds,
        tags: updateData.tags,
      };

      const result = await this.updateProductHandler.handle(command);

      if (result.success) {
        return ResponseHelper.ok(reply, "Product updated successfully", {
          productId: id,
          updatedAt: new Date().toISOString(),
        });
      }

      return ResponseHelper.fromCommand(reply, result, "Product updated successfully");
    } catch (error) {
      request.log.error(error, "Failed to update product");

      if (error instanceof Error && error.message.includes("not found")) {
        return ResponseHelper.notFound(reply, "Product not found");
      }

      if (
        error instanceof Error &&
        (error.message.includes("duplicate") || error.message.includes("unique"))
      ) {
        return reply.status(409).send({
          success: false,
          statusCode: 409,
          error: "Conflict",
          message: "Product with this title or slug already exists",
        });
      }

      return ResponseHelper.error(reply, error);
    }
  }

  async deleteProduct(
    request: FastifyRequest<{ Params: { productId: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const { productId: id } = request.params;

      const command: DeleteProductCommand = { productId: id };
      const result = await this.deleteProductHandler.handle(command);

      if (result.success) {
        return ResponseHelper.ok(reply, "Product deleted successfully");
      }

      return ResponseHelper.fromCommand(reply, result, "Product deleted successfully");
    } catch (error) {
      request.log.error(error, "Failed to delete product");

      if (error instanceof Error && error.message.includes("not found")) {
        return ResponseHelper.notFound(reply, "Product not found");
      }

      if (
        error instanceof Error &&
        (error.message.includes("constraint") || error.message.includes("foreign key"))
      ) {
        return reply.status(409).send({
          success: false,
          statusCode: 409,
          error: "Conflict",
          message: "Cannot delete product with existing variants or associations",
        });
      }

      return ResponseHelper.error(reply, error);
    }
  }
}
