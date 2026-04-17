import { FastifyReply } from "fastify";
import { AuthenticatedRequest } from "@/api/src/shared/interfaces/authenticated-request.interface";
import {
  CreateProductVariantHandler,
  UpdateProductVariantHandler,
  DeleteProductVariantHandler,
  ListVariantsHandler,
  GetVariantHandler,
} from "../../../application";
import { ResponseHelper } from "@/api/src/shared/response.helper";

export class VariantController {
  constructor(
    private readonly createVariantHandler: CreateProductVariantHandler,
    private readonly updateVariantHandler: UpdateProductVariantHandler,
    private readonly deleteVariantHandler: DeleteProductVariantHandler,
    private readonly listVariantsHandler: ListVariantsHandler,
    private readonly getVariantHandler: GetVariantHandler,
  ) {}

  async getVariants(
    request: AuthenticatedRequest<{
      Params: { productId: string };
      Querystring: {
        page?: number;
        limit?: number;
        size?: string;
        color?: string;
        inStock?: boolean;
        sortBy?: "sku" | "createdAt" | "size" | "color";
        sortOrder?: "asc" | "desc";
      };
    }>,
    reply: FastifyReply,
  ) {
    try {
      const result = await this.listVariantsHandler.handle({
        productId: request.params.productId,
        ...request.query,
      });
      return ResponseHelper.ok(reply, "Variants retrieved successfully", result);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async getVariant(
    request: AuthenticatedRequest<{ Params: { variantId: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const result = await this.getVariantHandler.handle({ variantId: request.params.variantId });
      return ResponseHelper.ok(reply, "Variant retrieved successfully", result);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async createVariant(
    request: AuthenticatedRequest<{
      Params: { productId: string };
      Body: {
        sku: string;
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
    }>,
    reply: FastifyReply,
  ) {
    try {
      const { productId } = request.params;
      const result = await this.createVariantHandler.handle({
        productId,
        ...request.body,
      });
      return ResponseHelper.fromCommand(reply, result, "Variant created successfully", 201);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async updateVariant(
    request: AuthenticatedRequest<{
      Params: { variantId: string };
      Body: {
        sku?: string;
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
    }>,
    reply: FastifyReply,
  ) {
    try {
      const result = await this.updateVariantHandler.handle({
        variantId: request.params.variantId,
        ...request.body,
      });
      return ResponseHelper.fromCommand(reply, result, "Variant updated successfully");
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async deleteVariant(
    request: AuthenticatedRequest<{ Params: { variantId: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const result = await this.deleteVariantHandler.handle({ variantId: request.params.variantId });
      return ResponseHelper.fromCommand(reply, result, "Variant deleted successfully", undefined, 204);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }
}
