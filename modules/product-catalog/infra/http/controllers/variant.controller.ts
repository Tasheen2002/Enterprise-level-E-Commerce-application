import { FastifyRequest, FastifyReply } from "fastify";
import { VariantManagementService } from "../../../application/services/variant-management.service";
import { PrismaClient } from "@prisma/client";
import { ResponseHelper } from "@/api/src/shared/response.helper";

interface CreateVariantRequest {
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

interface UpdateVariantRequest extends Partial<CreateVariantRequest> {}

interface VariantQueryParams {
  page?: number;
  limit?: number;
  size?: string;
  color?: string;
  inStock?: boolean;
  sortBy?: "sku" | "createdAt" | "size" | "color";
  sortOrder?: "asc" | "desc";
}

export class VariantController {
  constructor(
    private readonly variantManagementService: VariantManagementService,
    private readonly prisma?: PrismaClient,
  ) {}

  async getVariants(
    request: FastifyRequest<{
      Params: { productId: string };
      Querystring: VariantQueryParams;
    }>,
    reply: FastifyReply,
  ) {
    try {
      const { productId } = request.params;
      const {
        page = 1,
        limit = 20,
        size,
        color,
        inStock,
        sortBy = "createdAt",
        sortOrder = "asc",
      } = request.query;

      const options = {
        page: Math.max(1, page),
        limit: Math.min(100, Math.max(1, limit)),
        size,
        color,
        inStock,
        sortBy,
        sortOrder,
      };

      const variants = await this.variantManagementService.getVariantsByProduct(
        productId,
        options,
      );

      // Enrich variants with inventory if prisma is available
      let enrichedVariants = variants.map((v) => v.toData());

      if (this.prisma) {
        const variantIds = variants.map((v) => v.getId().getValue());
        const variantsWithInventory = await this.prisma.productVariant.findMany(
          {
            where: { id: { in: variantIds } },
            include: {
              inventoryStocks: true,
            },
          },
        );

        enrichedVariants = variants.map((v) => {
          const data = v.toData();
          const dbVariant = variantsWithInventory.find(
            (dbV) => dbV.id === data.id,
          );

          // Calculate total inventory
          const totalInventory =
            dbVariant?.inventoryStocks?.reduce((sum, stock) => {
              return sum + (stock.onHand - stock.reserved);
            }, 0) || 0;

          return {
            ...data,
            inventory: totalInventory,
          };
        });
      }

      return ResponseHelper.ok(reply, "Variants retrieved successfully", {
        variants: enrichedVariants,
        meta: {
          productId,
          page: options.page,
          limit: options.limit,
          filters: { size, color, inStock },
        },
      });
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
      const { id } = request.params;

      const variant = await this.variantManagementService.getVariantById(id);

      if (!variant) {
        return ResponseHelper.notFound(reply, "Variant not found");
      }

      let enrichedVariant = variant.toData();

      if (this.prisma) {
        const dbVariant = await this.prisma.productVariant.findUnique({
          where: { id },
          include: { inventoryStocks: true },
        });

        const totalInventory =
          dbVariant?.inventoryStocks?.reduce((sum, stock) => {
            return sum + (stock.onHand - stock.reserved);
          }, 0) || 0;

        enrichedVariant = { ...enrichedVariant, inventory: totalInventory };
      }

      return ResponseHelper.ok(reply, "Variant retrieved successfully", enrichedVariant);
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
      const variantData = request.body;

      const createData = {
        ...variantData,
        restockEta: variantData.restockEta ? new Date(variantData.restockEta) : undefined,
      };

      const variant = await this.variantManagementService.createVariant(productId, createData);

      return ResponseHelper.created(reply, "Variant created successfully", variant.toData());
    } catch (error) {
      request.log.error(error, "Failed to create variant");

      if (
        error instanceof Error &&
        (error.message.includes("duplicate") || error.message.includes("unique"))
      ) {
        return reply.status(409).send({
          success: false,
          statusCode: 409,
          error: "Conflict",
          message: "Variant with this SKU already exists",
        });
      }

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
      const { id } = request.params;
      const updateData = request.body;

      const updatePayload = {
        ...updateData,
        restockEta: updateData.restockEta ? new Date(updateData.restockEta) : undefined,
      };

      const variant = await this.variantManagementService.updateVariant(id, updatePayload);

      if (!variant) {
        return ResponseHelper.notFound(reply, "Variant not found");
      }

      return ResponseHelper.ok(reply, "Variant updated successfully", variant.toData());
    } catch (error) {
      request.log.error(error, "Failed to update variant");

      if (
        error instanceof Error &&
        (error.message.includes("duplicate") ||
          error.message.includes("unique") ||
          error.message.includes("already exists"))
      ) {
        return reply.status(409).send({
          success: false,
          statusCode: 409,
          error: "Conflict",
          message: error.message || "Variant with this SKU already exists",
        });
      }

      if (error instanceof Error && error.message.includes("found")) {
        return ResponseHelper.notFound(reply, error.message);
      }

      return ResponseHelper.error(reply, error);
    }
  }

  async deleteVariant(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const { id } = request.params;

      const deleted = await this.variantManagementService.deleteVariant(id);

      if (!deleted) {
        return ResponseHelper.notFound(reply, "Variant not found");
      }

      return ResponseHelper.ok(reply, "Variant deleted successfully");
    } catch (error) {
      request.log.error(error, "Failed to delete variant");
      return ResponseHelper.error(reply, error);
    }
  }
}
