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
import {
  VariantParams,
  VariantByProductParams,
  ListVariantsQuery,
  CreateVariantBody,
  UpdateVariantBody,
} from "../validation/variant.schema";

export class VariantController {
  constructor(
    private readonly createVariantHandler: CreateProductVariantHandler,
    private readonly updateVariantHandler: UpdateProductVariantHandler,
    private readonly deleteVariantHandler: DeleteProductVariantHandler,
    private readonly listVariantsHandler: ListVariantsHandler,
    private readonly getVariantHandler: GetVariantHandler,
  ) {}

  async getVariants(
    request: AuthenticatedRequest<{ Params: VariantByProductParams; Querystring: ListVariantsQuery }>,
    reply: FastifyReply,
  ) {
    try {
      const result = await this.listVariantsHandler.handle({
        productId: request.params.productId,
        page: request.query.page,
        limit: request.query.limit,
        size: request.query.size,
        color: request.query.color,
        sortBy: request.query.sortBy,
        sortOrder: request.query.sortOrder,
      });
      return ResponseHelper.ok(reply, "Variants retrieved successfully", result);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async getVariant(
    request: AuthenticatedRequest<{ Params: VariantParams }>,
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
    request: AuthenticatedRequest<{ Params: VariantByProductParams; Body: CreateVariantBody }>,
    reply: FastifyReply,
  ) {
    try {
      const result = await this.createVariantHandler.handle({
        productId: request.params.productId,
        sku: request.body.sku,
        size: request.body.size,
        color: request.body.color,
        barcode: request.body.barcode,
        weightG: request.body.weightG,
        dims: request.body.dims,
        taxClass: request.body.taxClass,
        allowBackorder: request.body.allowBackorder,
        allowPreorder: request.body.allowPreorder,
        restockEta: request.body.restockEta,
      });
      return ResponseHelper.fromCommand(reply, result, "Variant created successfully", 201);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async updateVariant(
    request: AuthenticatedRequest<{ Params: VariantParams; Body: UpdateVariantBody }>,
    reply: FastifyReply,
  ) {
    try {
      const result = await this.updateVariantHandler.handle({
        variantId: request.params.variantId,
        sku: request.body.sku,
        size: request.body.size,
        color: request.body.color,
        barcode: request.body.barcode,
        weightG: request.body.weightG,
        dims: request.body.dims,
        taxClass: request.body.taxClass,
        allowBackorder: request.body.allowBackorder,
        allowPreorder: request.body.allowPreorder,
        restockEta: request.body.restockEta,
      });
      return ResponseHelper.fromCommand(reply, result, "Variant updated successfully");
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async deleteVariant(
    request: AuthenticatedRequest<{ Params: VariantParams }>,
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
