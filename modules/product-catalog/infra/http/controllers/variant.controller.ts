import { FastifyRequest, FastifyReply } from "fastify";
import {
  CreateProductVariantCommand,
  CreateProductVariantHandler,
  UpdateProductVariantCommand,
  UpdateProductVariantHandler,
  DeleteProductVariantCommand,
  DeleteProductVariantHandler,
  ListVariantsQuery,
  ListVariantsHandler,
  GetVariantQuery,
  GetVariantHandler,
} from "../../../application";
import { VariantManagementService } from "../../../application/services/variant-management.service";
import { ResponseHelper } from "@/api/src/shared/response.helper";

export interface CreateVariantRequest {
  sku: string;
  size?: string;
  color?: string;
  barcode?: string;
  weightG?: number;
  dims?: Record<string, any>;
  taxClass?: string;
  allowBackorder?: boolean;
  allowPreorder?: boolean;
  restockEta?: string;
}

export interface UpdateVariantRequest extends Partial<CreateVariantRequest> {}

export interface VariantQueryParams {
  page?: number;
  limit?: number;
  size?: string;
  color?: string;
  inStock?: boolean;
  sortBy?: "sku" | "createdAt" | "size" | "color";
  sortOrder?: "asc" | "desc";
}

export class VariantController {
  private createVariantHandler: CreateProductVariantHandler;
  private updateVariantHandler: UpdateProductVariantHandler;
  private deleteVariantHandler: DeleteProductVariantHandler;
  private listVariantsHandler: ListVariantsHandler;
  private getVariantHandler: GetVariantHandler;

  constructor(variantManagementService: VariantManagementService) {
    this.createVariantHandler = new CreateProductVariantHandler(variantManagementService);
    this.updateVariantHandler = new UpdateProductVariantHandler(variantManagementService);
    this.deleteVariantHandler = new DeleteProductVariantHandler(variantManagementService);
    this.listVariantsHandler = new ListVariantsHandler(variantManagementService);
    this.getVariantHandler = new GetVariantHandler(variantManagementService);
  }

  async getVariants(
    request: FastifyRequest<{
      Params: { productId: string };
      Querystring: VariantQueryParams;
    }>,
    reply: FastifyReply,
  ) {
    try {
      const query: ListVariantsQuery = {
        productId: request.params.productId,
        page: request.query.page,
        limit: request.query.limit,
        size: request.query.size,
        color: request.query.color,
        inStock: request.query.inStock,
        sortBy: request.query.sortBy,
        sortOrder: request.query.sortOrder,
      };

      const result = await this.listVariantsHandler.handle(query);
      return ResponseHelper.fromQuery(reply, result, "Variants retrieved successfully");
    } catch (error) {
      request.log.error(error, "Failed to get variants");
      return ResponseHelper.error(reply, error);
    }
  }

  async getVariant(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const query: GetVariantQuery = { variantId: request.params.id };
      const result = await this.getVariantHandler.handle(query);
      return ResponseHelper.fromQuery(
        reply,
        result,
        "Variant retrieved successfully",
        "Variant not found",
      );
    } catch (error) {
      request.log.error(error, "Failed to get variant");
      return ResponseHelper.error(reply, error);
    }
  }

  async createVariant(
    request: FastifyRequest<{
      Params: { productId: string };
      Body: CreateVariantRequest;
    }>,
    reply: FastifyReply,
  ) {
    try {
      const { productId } = request.params;
      const body = request.body;

      const command: CreateProductVariantCommand = {
        productId,
        sku: body.sku,
        size: body.size,
        color: body.color,
        barcode: body.barcode,
        weightG: body.weightG,
        dims: body.dims,
        taxClass: body.taxClass,
        allowBackorder: body.allowBackorder,
        allowPreorder: body.allowPreorder,
        restockEta: body.restockEta ? new Date(body.restockEta) : undefined,
      };

      const result = await this.createVariantHandler.handle(command);

      if (result.success && result.data) {
        return ResponseHelper.created(
          reply,
          "Variant created successfully",
          result.data.toData(),
        );
      }
      return ResponseHelper.fromCommand(reply, result, "Variant created successfully");
    } catch (error) {
      request.log.error(error, "Failed to create variant");
      return ResponseHelper.error(reply, error);
    }
  }

  async updateVariant(
    request: FastifyRequest<{
      Params: { id: string };
      Body: UpdateVariantRequest;
    }>,
    reply: FastifyReply,
  ) {
    try {
      const body = request.body;

      const command: UpdateProductVariantCommand = {
        variantId: request.params.id,
        sku: body.sku,
        size: body.size,
        color: body.color,
        barcode: body.barcode,
        weightG: body.weightG,
        dims: body.dims,
        taxClass: body.taxClass,
        allowBackorder: body.allowBackorder,
        allowPreorder: body.allowPreorder,
        restockEta: body.restockEta ? new Date(body.restockEta) : undefined,
      };

      const result = await this.updateVariantHandler.handle(command);

      if (result.success && result.data) {
        return ResponseHelper.ok(
          reply,
          "Variant updated successfully",
          result.data.toData(),
        );
      }
      return ResponseHelper.fromCommand(reply, result, "Variant updated successfully");
    } catch (error) {
      request.log.error(error, "Failed to update variant");
      return ResponseHelper.error(reply, error);
    }
  }

  async deleteVariant(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const command: DeleteProductVariantCommand = { variantId: request.params.id };
      const result = await this.deleteVariantHandler.handle(command);
      return ResponseHelper.fromCommand(reply, result, "Variant deleted successfully");
    } catch (error) {
      request.log.error(error, "Failed to delete variant");
      return ResponseHelper.error(reply, error);
    }
  }
}
