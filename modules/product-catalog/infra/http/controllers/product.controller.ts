import { FastifyReply } from "fastify";
import { AuthenticatedRequest } from "@/api/src/shared/interfaces/authenticated-request.interface";
import {
  CreateProductHandler,
  UpdateProductHandler,
  DeleteProductHandler,
  GetProductHandler,
  ListProductsHandler,
} from "../../../application";
import { ResponseHelper } from "@/api/src/shared/response.helper";
import {
  ProductParams,
  ProductSlugParams,
  ListProductsQuery,
  CreateProductBody,
  UpdateProductBody,
} from "../validation/product.schema";

// Search lives in SearchController (/search endpoint). This controller covers
// product CRUD only — keep listProducts single-purpose.
export class ProductController {
  constructor(
    private readonly createProductHandler: CreateProductHandler,
    private readonly updateProductHandler: UpdateProductHandler,
    private readonly deleteProductHandler: DeleteProductHandler,
    private readonly getProductHandler: GetProductHandler,
    private readonly listProductsHandler: ListProductsHandler,
  ) {}

  // ── Reads ──────────────────────────────────────────────────────────────

  async listProducts(
    request: AuthenticatedRequest<{ Querystring: ListProductsQuery }>,
    reply: FastifyReply,
  ) {
    try {
      const result = await this.listProductsHandler.handle(request.query);
      return ResponseHelper.ok(reply, "Products retrieved successfully", result);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async getProduct(
    request: AuthenticatedRequest<{ Params: ProductParams }>,
    reply: FastifyReply,
  ) {
    try {
      const result = await this.getProductHandler.handle({ productId: request.params.productId });
      return ResponseHelper.ok(reply, "Product retrieved successfully", result);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async getProductBySlug(
    request: AuthenticatedRequest<{ Params: ProductSlugParams }>,
    reply: FastifyReply,
  ) {
    try {
      const result = await this.getProductHandler.handle({ slug: request.params.slug });
      return ResponseHelper.ok(reply, "Product retrieved successfully", result);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  // ── Writes ─────────────────────────────────────────────────────────────

  async createProduct(
    request: AuthenticatedRequest<{ Body: CreateProductBody }>,
    reply: FastifyReply,
  ) {
    try {
      const result = await this.createProductHandler.handle(request.body);
      return ResponseHelper.fromCommand(reply, result, "Product created successfully", 201);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async updateProduct(
    request: AuthenticatedRequest<{ Params: ProductParams; Body: UpdateProductBody }>,
    reply: FastifyReply,
  ) {
    try {
      const result = await this.updateProductHandler.handle({
        productId: request.params.productId,
        title: request.body.title,
        brand: request.body.brand,
        shortDesc: request.body.shortDesc,
        longDescHtml: request.body.longDescHtml,
        status: request.body.status,
        publishAt: request.body.publishAt,
        countryOfOrigin: request.body.countryOfOrigin,
        seoTitle: request.body.seoTitle,
        seoDescription: request.body.seoDescription,
        price: request.body.price,
        currency: request.body.currency,
        priceSgd: request.body.priceSgd,
        priceUsd: request.body.priceUsd,
        compareAtPrice: request.body.compareAtPrice,
        categoryIds: request.body.categoryIds,
        tags: request.body.tags,
      });
      return ResponseHelper.fromCommand(reply, result, "Product updated successfully");
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async deleteProduct(
    request: AuthenticatedRequest<{ Params: ProductParams }>,
    reply: FastifyReply,
  ) {
    try {
      const result = await this.deleteProductHandler.handle({ productId: request.params.productId });
      return ResponseHelper.fromCommand(reply, result, "Product deleted successfully", undefined, 204);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }
}
