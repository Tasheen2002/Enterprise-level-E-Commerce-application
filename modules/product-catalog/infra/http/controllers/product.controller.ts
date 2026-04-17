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
      const { search, ...queryRest } = request.query;

      if (search) {
        const result = await this.searchProductsHandler.handle({
          searchTerm: search,
          ...queryRest,
        });
        return ResponseHelper.ok(reply, "Products retrieved successfully", result);
      }

      const result = await this.listProductsHandler.handle(queryRest);
      return ResponseHelper.ok(reply, "Products retrieved successfully", result);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async getProduct(
    request: AuthenticatedRequest<{ Params: { productId: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const { productId } = request.params;
      const result = await this.getProductHandler.handle({ productId });
      return ResponseHelper.ok(reply, "Product retrieved successfully", result);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async getProductBySlug(
    request: AuthenticatedRequest<{ Params: { slug: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const { slug } = request.params;
      const result = await this.getProductHandler.handle({ slug });
      return ResponseHelper.ok(reply, "Product retrieved successfully", result);
    } catch (error: unknown) {
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
        publishAt?: Date;
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
      const result = await this.createProductHandler.handle(request.body);
      return ResponseHelper.fromCommand(reply, result, "Product created successfully", 201);
    } catch (error: unknown) {
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
      const result = await this.updateProductHandler.handle({
        productId,
        ...request.body,
      });
      return ResponseHelper.fromCommand(reply, result, "Product updated successfully");
    } catch (error: unknown) {
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
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }
}
