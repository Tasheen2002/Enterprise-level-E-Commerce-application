import { FastifyReply } from "fastify";
import { AuthenticatedRequest } from "@/api/src/shared/interfaces/authenticated-request.interface";
import {
  CreateProductHandler,
  UpdateProductHandler,
  DeleteProductHandler,
  GetProductHandler,
  ListProductsHandler,
  SearchProductsHandler,
} from "../../../application";
import { ProductManagementService } from "../../../application/services/product-management.service";
import { ProductStatus } from "../../../domain/enums";
import { ResponseHelper } from "@/api/src/shared/response.helper";

export class ProductController {
  constructor(
    private readonly createProductHandler: CreateProductHandler,
    private readonly updateProductHandler: UpdateProductHandler,
    private readonly deleteProductHandler: DeleteProductHandler,
    private readonly getProductHandler: GetProductHandler,
    private readonly listProductsHandler: ListProductsHandler,
    private readonly searchProductsHandler: SearchProductsHandler,
    private readonly productManagementService: ProductManagementService,
  ) {}

  async listProducts(
    request: AuthenticatedRequest<{
      Querystring: {
        page?: number;
        limit?: number;
        status?: ProductStatus;
        brand?: string;
        categoryId?: string;
        search?: string;
        includeDrafts?: boolean;
        sortBy?: "createdAt" | "title" | "publishAt";
        sortOrder?: "asc" | "desc";
      };
    }>,
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
        const searchResult = await this.searchProductsHandler.handle({
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
        });
        products = searchResult.items;
        totalCount = searchResult.totalCount;
      } else {
        const result = await this.listProductsHandler.handle({
          page: currentPage,
          limit: currentLimit,
          status,
          brand,
          categoryId,
          includeDrafts,
          sortBy,
          sortOrder,
        });
        products = result.items;
        totalCount = result.totalCount;
      }

      const productIds = products.map((p) => p.id || p.productId || p.product_id);
      const enrichmentMap = await this.productManagementService.getProductEnrichment(productIds);

      const productsWithDetails = products.map((product) => {
        const pId = product.id || product.productId || product.product_id;
        const enriched = enrichmentMap.get(pId);
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
          variants: enriched?.variants || [],
          images: enriched?.images || [],
          categories: enriched?.categories || [],
        };
      });

      return ResponseHelper.ok(reply, "Products retrieved successfully", {
        products: productsWithDetails,
        total: totalCount,
        page: currentPage,
        limit: currentLimit,
      });
    } catch (error) {
      return ResponseHelper.error(reply, error);
    }
  }

  async getProduct(
    request: AuthenticatedRequest<{ Params: { productId: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const { productId } = request.params;
      const productData = await this.getProductHandler.handle({ productId });
      const mediaEnrichment = await this.productManagementService.getProductMediaEnrichment(productId);

      return ResponseHelper.ok(reply, "Product retrieved successfully", {
        ...productData,
        slug: productData?.slug || "",
        images: mediaEnrichment.images,
        media: mediaEnrichment.media,
      });
    } catch (error) {
      return ResponseHelper.error(reply, error);
    }
  }

  async getProductBySlug(
    request: AuthenticatedRequest<{ Params: { slug: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const { slug } = request.params;
      const productData = await this.getProductHandler.handle({ slug });
      const enrichment = await this.productManagementService.getSingleProductEnrichment(productData.id);

      return ResponseHelper.ok(reply, "Product retrieved successfully", {
        ...productData,
        variants: enrichment.variants,
        images: enrichment.images,
        categories: enrichment.categories,
      });
    } catch (error) {
      return ResponseHelper.error(reply, error);
    }
  }

  async createProduct(
    request: AuthenticatedRequest<{
      Body: {
        title: string;
        brand?: string;
        shortDesc?: string;
        longDescHtml?: string;
        status?: ProductStatus;
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
      };
    }>,
    reply: FastifyReply,
  ) {
    try {
      const { publishAt, ...rest } = request.body;
      const result = await this.createProductHandler.handle({
        ...rest,
        publishAt: publishAt ? new Date(publishAt) : undefined,
      });
      return ResponseHelper.fromCommand(reply, result, "Product created successfully", 201);
    } catch (error) {
      return ResponseHelper.error(reply, error);
    }
  }

  async updateProduct(
    request: AuthenticatedRequest<{
      Params: { productId: string };
      Body: {
        title?: string;
        brand?: string;
        shortDesc?: string;
        longDescHtml?: string;
        status?: ProductStatus;
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
      };
    }>,
    reply: FastifyReply,
  ) {
    try {
      const { productId } = request.params;
      const { publishAt, ...rest } = request.body;
      const result = await this.updateProductHandler.handle({
        productId,
        ...rest,
        publishAt: publishAt ? new Date(publishAt) : undefined,
      });
      return ResponseHelper.fromCommand(reply, result, "Product updated successfully");
    } catch (error) {
      return ResponseHelper.error(reply, error);
    }
  }

  async deleteProduct(
    request: AuthenticatedRequest<{ Params: { productId: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const { productId } = request.params;
      const result = await this.deleteProductHandler.handle({ productId });
      return ResponseHelper.fromCommand(reply, result, "Product deleted successfully", undefined, 204);
    } catch (error) {
      return ResponseHelper.error(reply, error);
    }
  }
}
