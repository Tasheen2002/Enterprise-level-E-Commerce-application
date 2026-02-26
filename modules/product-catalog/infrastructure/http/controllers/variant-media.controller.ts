import { FastifyRequest, FastifyReply } from "fastify";
import {
  VariantMediaManagementService,
  VariantMediaServiceQueryOptions,
} from "../../../application/services/variant-media-management.service";

interface AddMediaToVariantRequest {
  assetId: string;
}

interface SetVariantMediaRequest {
  assetIds: string[];
}

interface AddMediaToMultipleVariantsRequest {
  variantIds: string[];
  assetId: string;
}

interface AddMultipleMediaToVariantRequest {
  variantId: string;
  assetIds: string[];
}

interface CopyProductVariantMediaRequest {
  sourceProductId: string;
  targetProductId: string;
  variantMapping: Record<string, string>;
}

interface VariantMediaQueryParams extends VariantMediaServiceQueryOptions {}

export class VariantMediaController {
  constructor(
    private readonly variantMediaManagementService: VariantMediaManagementService,
  ) {}

  async getVariantMedia(
    request: FastifyRequest<{ Params: { variantId: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const { variantId } = request.params;

      if (!variantId || typeof variantId !== "string") {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: "Variant ID is required and must be a valid string",
        });
      }

      const variantMedia =
        await this.variantMediaManagementService.getVariantMedia(variantId);

      return reply.code(200).send({
        success: true,
        data: variantMedia,
      });
    } catch (error) {
      request.log.error(error, "Failed to get variant media");

      if (error instanceof Error && error.message.includes("not found")) {
        return reply.code(404).send({
          success: false,
          error: "Not Found",
          message: "Product variant not found",
        });
      }

      return reply.code(500).send({
        success: false,
        error: "Internal server error",
        message: "Failed to retrieve variant media",
      });
    }
  }

  async addMediaToVariant(
    request: FastifyRequest<{
      Params: { variantId: string };
      Body: AddMediaToVariantRequest;
    }>,
    reply: FastifyReply,
  ) {
    try {
      const { variantId } = request.params;
      const { assetId } = request.body;

      if (!variantId || typeof variantId !== "string") {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: "Variant ID is required and must be a valid string",
        });
      }

      if (!assetId || typeof assetId !== "string") {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: "Asset ID is required and must be a valid string",
        });
      }

      await this.variantMediaManagementService.addMediaToVariant(
        variantId,
        assetId,
      );

      return reply.code(201).send({
        success: true,
        message: "Media added to variant successfully",
      });
    } catch (error) {
      request.log.error(error, "Failed to add media to variant");

      if (error instanceof Error && error.message.includes("not found")) {
        return reply.code(404).send({
          success: false,
          error: "Not Found",
          message: error.message,
        });
      }

      if (
        error instanceof Error &&
        error.message.includes("already associated")
      ) {
        return reply.code(409).send({
          success: false,
          error: "Conflict",
          message: error.message,
        });
      }

      return reply.code(500).send({
        success: false,
        error: "Internal server error",
        message: "Failed to add media to variant",
      });
    }
  }

  async removeMediaFromVariant(
    request: FastifyRequest<{ Params: { variantId: string; assetId: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const { variantId, assetId } = request.params;

      if (!variantId || typeof variantId !== "string") {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: "Variant ID is required and must be a valid string",
        });
      }

      if (!assetId || typeof assetId !== "string") {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: "Asset ID is required and must be a valid string",
        });
      }

      await this.variantMediaManagementService.removeMediaFromVariant(
        variantId,
        assetId,
      );

      return reply.code(200).send({
        success: true,
        message: "Media removed from variant successfully",
      });
    } catch (error) {
      request.log.error(error, "Failed to remove media from variant");

      if (error instanceof Error && error.message.includes("not associated")) {
        return reply.code(404).send({
          success: false,
          error: "Not Found",
          message: error.message,
        });
      }

      return reply.code(500).send({
        success: false,
        error: "Internal server error",
        message: "Failed to remove media from variant",
      });
    }
  }

  async removeAllVariantMedia(
    request: FastifyRequest<{ Params: { variantId: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const { variantId } = request.params;

      if (!variantId || typeof variantId !== "string") {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: "Variant ID is required and must be a valid string",
        });
      }

      await this.variantMediaManagementService.removeAllVariantMedia(variantId);

      return reply.code(200).send({
        success: true,
        message: "All media removed from variant successfully",
      });
    } catch (error) {
      request.log.error(error, "Failed to remove all variant media");

      if (error instanceof Error && error.message.includes("not found")) {
        return reply.code(404).send({
          success: false,
          error: "Not Found",
          message: "Product variant not found",
        });
      }

      return reply.code(500).send({
        success: false,
        error: "Internal server error",
        message: "Failed to remove all variant media",
      });
    }
  }

  async setVariantMedia(
    request: FastifyRequest<{
      Params: { variantId: string };
      Body: SetVariantMediaRequest;
    }>,
    reply: FastifyReply,
  ) {
    try {
      const { variantId } = request.params;
      const { assetIds } = request.body;

      if (!variantId || typeof variantId !== "string") {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: "Variant ID is required and must be a valid string",
        });
      }

      if (!assetIds || !Array.isArray(assetIds)) {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: "Asset IDs must be an array",
        });
      }

      // Validate each asset ID
      for (const assetId of assetIds) {
        if (!assetId || typeof assetId !== "string") {
          return reply.code(400).send({
            success: false,
            error: "Bad Request",
            message: "All asset IDs must be valid strings",
          });
        }
      }

      await this.variantMediaManagementService.setVariantMedia(
        variantId,
        assetIds,
      );

      return reply.code(200).send({
        success: true,
        message: "Variant media set successfully",
      });
    } catch (error) {
      request.log.error(error, "Failed to set variant media");

      if (error instanceof Error && error.message.includes("not found")) {
        return reply.code(404).send({
          success: false,
          error: "Not Found",
          message: error.message,
        });
      }

      return reply.code(500).send({
        success: false,
        error: "Internal server error",
        message: "Failed to set variant media",
      });
    }
  }

  async addMediaToMultipleVariants(
    request: FastifyRequest<{ Body: AddMediaToMultipleVariantsRequest }>,
    reply: FastifyReply,
  ) {
    try {
      const { variantIds, assetId } = request.body;

      if (
        !variantIds ||
        !Array.isArray(variantIds) ||
        variantIds.length === 0
      ) {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: "Variant IDs are required and must be a non-empty array",
        });
      }

      if (!assetId || typeof assetId !== "string") {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: "Asset ID is required and must be a valid string",
        });
      }

      // Validate each variant ID
      for (const variantId of variantIds) {
        if (!variantId || typeof variantId !== "string") {
          return reply.code(400).send({
            success: false,
            error: "Bad Request",
            message: "All variant IDs must be valid strings",
          });
        }
      }

      await this.variantMediaManagementService.addMediaToMultipleVariants(
        variantIds,
        assetId,
      );

      return reply.code(201).send({
        success: true,
        message: `Media added to ${variantIds.length} variants successfully`,
      });
    } catch (error) {
      request.log.error(error, "Failed to add media to multiple variants");

      if (error instanceof Error && error.message.includes("not found")) {
        return reply.code(404).send({
          success: false,
          error: "Not Found",
          message: error.message,
        });
      }

      return reply.code(500).send({
        success: false,
        error: "Internal server error",
        message: "Failed to add media to multiple variants",
      });
    }
  }

  async addMultipleMediaToVariant(
    request: FastifyRequest<{ Body: AddMultipleMediaToVariantRequest }>,
    reply: FastifyReply,
  ) {
    try {
      const { variantId, assetIds } = request.body;

      if (!variantId || typeof variantId !== "string") {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: "Variant ID is required and must be a valid string",
        });
      }

      if (!assetIds || !Array.isArray(assetIds) || assetIds.length === 0) {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: "Asset IDs are required and must be a non-empty array",
        });
      }

      // Validate each asset ID
      for (const assetId of assetIds) {
        if (!assetId || typeof assetId !== "string") {
          return reply.code(400).send({
            success: false,
            error: "Bad Request",
            message: "All asset IDs must be valid strings",
          });
        }
      }

      await this.variantMediaManagementService.addMultipleMediaToVariant(
        variantId,
        assetIds,
      );

      return reply.code(201).send({
        success: true,
        message: `${assetIds.length} media assets added to variant successfully`,
      });
    } catch (error) {
      request.log.error(error, "Failed to add multiple media to variant");

      if (error instanceof Error && error.message.includes("not found")) {
        return reply.code(404).send({
          success: false,
          error: "Not Found",
          message: error.message,
        });
      }

      return reply.code(500).send({
        success: false,
        error: "Internal server error",
        message: "Failed to add multiple media to variant",
      });
    }
  }

  async duplicateVariantMedia(
    request: FastifyRequest<{
      Params: { sourceVariantId: string; targetVariantId: string };
    }>,
    reply: FastifyReply,
  ) {
    try {
      const { sourceVariantId, targetVariantId } = request.params;

      if (!sourceVariantId || typeof sourceVariantId !== "string") {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: "Source variant ID is required and must be a valid string",
        });
      }

      if (!targetVariantId || typeof targetVariantId !== "string") {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: "Target variant ID is required and must be a valid string",
        });
      }

      if (sourceVariantId === targetVariantId) {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: "Source and target variant IDs must be different",
        });
      }

      await this.variantMediaManagementService.duplicateVariantMedia(
        sourceVariantId,
        targetVariantId,
      );

      return reply.code(200).send({
        success: true,
        message: "Variant media duplicated successfully",
      });
    } catch (error) {
      request.log.error(error, "Failed to duplicate variant media");

      if (error instanceof Error && error.message.includes("not found")) {
        return reply.code(404).send({
          success: false,
          error: "Not Found",
          message: error.message,
        });
      }

      return reply.code(500).send({
        success: false,
        error: "Internal server error",
        message: "Failed to duplicate variant media",
      });
    }
  }

  async getProductVariantMedia(
    request: FastifyRequest<{
      Params: { productId: string };
      Querystring: VariantMediaQueryParams;
    }>,
    reply: FastifyReply,
  ) {
    try {
      const { productId } = request.params;
      const options = request.query;

      if (!productId || typeof productId !== "string") {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: "Product ID is required and must be a valid string",
        });
      }

      const productVariantMedia =
        await this.variantMediaManagementService.getProductVariantMedia(
          productId,
          options,
        );

      return reply.code(200).send({
        success: true,
        data: productVariantMedia,
      });
    } catch (error) {
      request.log.error(error, "Failed to get product variant media");

      if (error instanceof Error && error.message.includes("not found")) {
        return reply.code(404).send({
          success: false,
          error: "Not Found",
          message: "Product not found",
        });
      }

      return reply.code(500).send({
        success: false,
        error: "Internal server error",
        message: "Failed to retrieve product variant media",
      });
    }
  }

  async copyProductVariantMedia(
    request: FastifyRequest<{ Body: CopyProductVariantMediaRequest }>,
    reply: FastifyReply,
  ) {
    try {
      const { sourceProductId, targetProductId, variantMapping } = request.body;

      if (!sourceProductId || typeof sourceProductId !== "string") {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: "Source product ID is required and must be a valid string",
        });
      }

      if (!targetProductId || typeof targetProductId !== "string") {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: "Target product ID is required and must be a valid string",
        });
      }

      if (!variantMapping || typeof variantMapping !== "object") {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: "Variant mapping is required and must be an object",
        });
      }

      if (sourceProductId === targetProductId) {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: "Source and target product IDs must be different",
        });
      }

      await this.variantMediaManagementService.copyProductVariantMedia(
        sourceProductId,
        targetProductId,
        variantMapping,
      );

      return reply.code(200).send({
        success: true,
        message: "Product variant media copied successfully",
      });
    } catch (error) {
      request.log.error(error, "Failed to copy product variant media");

      if (error instanceof Error && error.message.includes("not found")) {
        return reply.code(404).send({
          success: false,
          error: "Not Found",
          message: error.message,
        });
      }

      return reply.code(500).send({
        success: false,
        error: "Internal server error",
        message: "Failed to copy product variant media",
      });
    }
  }

  async getVariantsUsingAsset(
    request: FastifyRequest<{ Params: { assetId: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const { assetId } = request.params;

      if (!assetId || typeof assetId !== "string") {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: "Asset ID is required and must be a valid string",
        });
      }

      const variantIds =
        await this.variantMediaManagementService.getVariantsUsingAsset(assetId);

      return reply.code(200).send({
        success: true,
        data: variantIds,
      });
    } catch (error) {
      request.log.error(error, "Failed to get variants using asset");

      if (error instanceof Error && error.message.includes("not found")) {
        return reply.code(404).send({
          success: false,
          error: "Not Found",
          message: "Media asset not found",
        });
      }

      return reply.code(500).send({
        success: false,
        error: "Internal server error",
        message: "Failed to get variants using asset",
      });
    }
  }

  async getAssetUsageCount(
    request: FastifyRequest<{ Params: { assetId: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const { assetId } = request.params;

      if (!assetId || typeof assetId !== "string") {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: "Asset ID is required and must be a valid string",
        });
      }

      const usageCount =
        await this.variantMediaManagementService.getAssetUsageCount(assetId);

      return reply.code(200).send({
        success: true,
        data: { assetId, usageCount },
      });
    } catch (error) {
      request.log.error(error, "Failed to get asset usage count");

      if (error instanceof Error && error.message.includes("not found")) {
        return reply.code(404).send({
          success: false,
          error: "Not Found",
          message: "Media asset not found",
        });
      }

      return reply.code(500).send({
        success: false,
        error: "Internal server error",
        message: "Failed to get asset usage count",
      });
    }
  }

  async getColorVariantMedia(
    request: FastifyRequest<{ Params: { productId: string; color: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const { productId, color } = request.params;

      if (!productId || typeof productId !== "string") {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: "Product ID is required and must be a valid string",
        });
      }

      if (!color || typeof color !== "string") {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: "Color is required and must be a valid string",
        });
      }

      const colorVariantMedia =
        await this.variantMediaManagementService.getColorVariantMedia(
          productId,
          decodeURIComponent(color),
        );

      return reply.code(200).send({
        success: true,
        data: colorVariantMedia,
      });
    } catch (error) {
      request.log.error(error, "Failed to get color variant media");

      if (error instanceof Error && error.message.includes("not found")) {
        return reply.code(404).send({
          success: false,
          error: "Not Found",
          message: "Product not found",
        });
      }

      return reply.code(500).send({
        success: false,
        error: "Internal server error",
        message: "Failed to get color variant media",
      });
    }
  }

  async getSizeVariantMedia(
    request: FastifyRequest<{ Params: { productId: string; size: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const { productId, size } = request.params;

      if (!productId || typeof productId !== "string") {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: "Product ID is required and must be a valid string",
        });
      }

      if (!size || typeof size !== "string") {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: "Size is required and must be a valid string",
        });
      }

      const sizeVariantMedia =
        await this.variantMediaManagementService.getSizeVariantMedia(
          productId,
          decodeURIComponent(size),
        );

      return reply.code(200).send({
        success: true,
        data: sizeVariantMedia,
      });
    } catch (error) {
      request.log.error(error, "Failed to get size variant media");

      if (error instanceof Error && error.message.includes("not found")) {
        return reply.code(404).send({
          success: false,
          error: "Not Found",
          message: "Product not found",
        });
      }

      return reply.code(500).send({
        success: false,
        error: "Internal server error",
        message: "Failed to get size variant media",
      });
    }
  }

  async getUnusedAssets(
    request: FastifyRequest<{ Querystring: { productId?: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const { productId } = request.query;

      if (productId && typeof productId !== "string") {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: "Product ID must be a valid string if provided",
        });
      }

      const unusedAssetIds =
        await this.variantMediaManagementService.getUnusedAssets(productId);

      return reply.code(200).send({
        success: true,
        data: unusedAssetIds,
        meta: {
          productId: productId || "all",
        },
      });
    } catch (error) {
      request.log.error(error, "Failed to get unused assets");

      if (error instanceof Error && error.message.includes("not found")) {
        return reply.code(404).send({
          success: false,
          error: "Not Found",
          message: "Product not found",
        });
      }

      return reply.code(500).send({
        success: false,
        error: "Internal server error",
        message: "Failed to get unused assets",
      });
    }
  }

  async validateVariantMedia(
    request: FastifyRequest<{ Params: { variantId: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const { variantId } = request.params;

      if (!variantId || typeof variantId !== "string") {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: "Variant ID is required and must be a valid string",
        });
      }

      const validation =
        await this.variantMediaManagementService.validateVariantMedia(
          variantId,
        );

      return reply.code(200).send({
        success: true,
        data: validation,
      });
    } catch (error) {
      request.log.error(error, "Failed to validate variant media");

      if (error instanceof Error && error.message.includes("not found")) {
        return reply.code(404).send({
          success: false,
          error: "Not Found",
          message: "Product variant not found",
        });
      }

      return reply.code(500).send({
        success: false,
        error: "Internal server error",
        message: "Failed to validate variant media",
      });
    }
  }

  async getVariantMediaStatistics(
    request: FastifyRequest<{ Params: { variantId: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const { variantId } = request.params;

      if (!variantId || typeof variantId !== "string") {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: "Variant ID is required and must be a valid string",
        });
      }

      const statistics =
        await this.variantMediaManagementService.getVariantMediaStatistics(
          variantId,
        );

      return reply.code(200).send({
        success: true,
        data: statistics,
      });
    } catch (error) {
      request.log.error(error, "Failed to get variant media statistics");

      if (error instanceof Error && error.message.includes("not found")) {
        return reply.code(404).send({
          success: false,
          error: "Not Found",
          message: "Product variant not found",
        });
      }

      return reply.code(500).send({
        success: false,
        error: "Internal server error",
        message: "Failed to get variant media statistics",
      });
    }
  }
}
