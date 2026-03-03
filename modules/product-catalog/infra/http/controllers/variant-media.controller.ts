import { FastifyRequest, FastifyReply } from "fastify";
import {
  VariantMediaManagementService,
  VariantMediaServiceQueryOptions,
} from "../../../application/services/variant-media-management.service";
import { ResponseHelper } from "@/api/src/shared/response.helper";

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

      const variantMedia =
        await this.variantMediaManagementService.getVariantMedia(variantId);

      return ResponseHelper.ok(reply, "Variant media retrieved successfully", variantMedia);
    } catch (error) {
      request.log.error(error, "Failed to get variant media");

      if (error instanceof Error && error.message.includes("not found")) {
        return ResponseHelper.notFound(reply, "Product variant not found");
      }

      return ResponseHelper.error(reply, error);
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

      await this.variantMediaManagementService.addMediaToVariant(
        variantId,
        assetId,
      );

      return ResponseHelper.created(reply, "Media added to variant successfully");
    } catch (error) {
      request.log.error(error, "Failed to add media to variant");

      if (error instanceof Error && error.message.includes("not found")) {
        return ResponseHelper.notFound(reply, error.message);
      }

      if (
        error instanceof Error &&
        error.message.includes("already associated")
      ) {
        return reply.status(409).send({
          success: false,
          statusCode: 409,
          error: "Conflict",
          message: error.message,
        });
      }

      return ResponseHelper.error(reply, error);
    }
  }

  async removeMediaFromVariant(
    request: FastifyRequest<{ Params: { variantId: string; assetId: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const { variantId, assetId } = request.params;

      await this.variantMediaManagementService.removeMediaFromVariant(
        variantId,
        assetId,
      );

      return ResponseHelper.ok(reply, "Media removed from variant successfully");
    } catch (error) {
      request.log.error(error, "Failed to remove media from variant");

      if (error instanceof Error && error.message.includes("not associated")) {
        return ResponseHelper.notFound(reply, error.message);
      }

      return ResponseHelper.error(reply, error);
    }
  }

  async removeAllVariantMedia(
    request: FastifyRequest<{ Params: { variantId: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const { variantId } = request.params;

      await this.variantMediaManagementService.removeAllVariantMedia(variantId);

      return ResponseHelper.ok(reply, "All media removed from variant successfully");
    } catch (error) {
      request.log.error(error, "Failed to remove all variant media");

      if (error instanceof Error && error.message.includes("not found")) {
        return ResponseHelper.notFound(reply, "Product variant not found");
      }

      return ResponseHelper.error(reply, error);
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

      await this.variantMediaManagementService.setVariantMedia(
        variantId,
        assetIds,
      );

      return ResponseHelper.ok(reply, "Variant media set successfully");
    } catch (error) {
      request.log.error(error, "Failed to set variant media");

      if (error instanceof Error && error.message.includes("not found")) {
        return ResponseHelper.notFound(reply, error.message);
      }

      return ResponseHelper.error(reply, error);
    }
  }

  async addMediaToMultipleVariants(
    request: FastifyRequest<{ Body: AddMediaToMultipleVariantsRequest }>,
    reply: FastifyReply,
  ) {
    try {
      const { variantIds, assetId } = request.body;

      await this.variantMediaManagementService.addMediaToMultipleVariants(
        variantIds,
        assetId,
      );

      return ResponseHelper.created(reply, `Media added to ${variantIds.length} variants successfully`);
    } catch (error) {
      request.log.error(error, "Failed to add media to multiple variants");

      if (error instanceof Error && error.message.includes("not found")) {
        return ResponseHelper.notFound(reply, error.message);
      }

      return ResponseHelper.error(reply, error);
    }
  }

  async addMultipleMediaToVariant(
    request: FastifyRequest<{ Body: AddMultipleMediaToVariantRequest }>,
    reply: FastifyReply,
  ) {
    try {
      const { variantId, assetIds } = request.body;

      await this.variantMediaManagementService.addMultipleMediaToVariant(
        variantId,
        assetIds,
      );

      return ResponseHelper.created(reply, `${assetIds.length} media assets added to variant successfully`);
    } catch (error) {
      request.log.error(error, "Failed to add multiple media to variant");

      if (error instanceof Error && error.message.includes("not found")) {
        return ResponseHelper.notFound(reply, error.message);
      }

      return ResponseHelper.error(reply, error);
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

      await this.variantMediaManagementService.duplicateVariantMedia(
        sourceVariantId,
        targetVariantId,
      );

      return ResponseHelper.ok(reply, "Variant media duplicated successfully");
    } catch (error) {
      request.log.error(error, "Failed to duplicate variant media");

      if (error instanceof Error && error.message.includes("not found")) {
        return ResponseHelper.notFound(reply, error.message);
      }

      return ResponseHelper.error(reply, error);
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

      const productVariantMedia =
        await this.variantMediaManagementService.getProductVariantMedia(
          productId,
          options,
        );

      return ResponseHelper.ok(reply, "Product variant media retrieved successfully", productVariantMedia);
    } catch (error) {
      request.log.error(error, "Failed to get product variant media");

      if (error instanceof Error && error.message.includes("not found")) {
        return ResponseHelper.notFound(reply, "Product not found");
      }

      return ResponseHelper.error(reply, error);
    }
  }

  async copyProductVariantMedia(
    request: FastifyRequest<{ Body: CopyProductVariantMediaRequest }>,
    reply: FastifyReply,
  ) {
    try {
      const { sourceProductId, targetProductId, variantMapping } = request.body;

      await this.variantMediaManagementService.copyProductVariantMedia(
        sourceProductId,
        targetProductId,
        variantMapping,
      );

      return ResponseHelper.ok(reply, "Product variant media copied successfully");
    } catch (error) {
      request.log.error(error, "Failed to copy product variant media");

      if (error instanceof Error && error.message.includes("not found")) {
        return ResponseHelper.notFound(reply, error.message);
      }

      return ResponseHelper.error(reply, error);
    }
  }

  async getVariantsUsingAsset(
    request: FastifyRequest<{ Params: { assetId: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const { assetId } = request.params;

      const variantIds =
        await this.variantMediaManagementService.getVariantsUsingAsset(assetId);

      return ResponseHelper.ok(reply, "Variants using asset retrieved successfully", variantIds);
    } catch (error) {
      request.log.error(error, "Failed to get variants using asset");

      if (error instanceof Error && error.message.includes("not found")) {
        return ResponseHelper.notFound(reply, "Media asset not found");
      }

      return ResponseHelper.error(reply, error);
    }
  }

  async getAssetUsageCount(
    request: FastifyRequest<{ Params: { assetId: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const { assetId } = request.params;

      const usageCount =
        await this.variantMediaManagementService.getAssetUsageCount(assetId);

      return ResponseHelper.ok(reply, "Asset usage count retrieved successfully", { assetId, usageCount });
    } catch (error) {
      request.log.error(error, "Failed to get asset usage count");

      if (error instanceof Error && error.message.includes("not found")) {
        return ResponseHelper.notFound(reply, "Media asset not found");
      }

      return ResponseHelper.error(reply, error);
    }
  }

  async getColorVariantMedia(
    request: FastifyRequest<{ Params: { productId: string; color: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const { productId, color } = request.params;

      const colorVariantMedia =
        await this.variantMediaManagementService.getColorVariantMedia(
          productId,
          decodeURIComponent(color),
        );

      return ResponseHelper.ok(reply, "Color variant media retrieved successfully", colorVariantMedia);
    } catch (error) {
      request.log.error(error, "Failed to get color variant media");

      if (error instanceof Error && error.message.includes("not found")) {
        return ResponseHelper.notFound(reply, "Product not found");
      }

      return ResponseHelper.error(reply, error);
    }
  }

  async getSizeVariantMedia(
    request: FastifyRequest<{ Params: { productId: string; size: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const { productId, size } = request.params;

      const sizeVariantMedia =
        await this.variantMediaManagementService.getSizeVariantMedia(
          productId,
          decodeURIComponent(size),
        );

      return ResponseHelper.ok(reply, "Size variant media retrieved successfully", sizeVariantMedia);
    } catch (error) {
      request.log.error(error, "Failed to get size variant media");

      if (error instanceof Error && error.message.includes("not found")) {
        return ResponseHelper.notFound(reply, "Product not found");
      }

      return ResponseHelper.error(reply, error);
    }
  }

  async getUnusedAssets(
    request: FastifyRequest<{ Querystring: { productId?: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const { productId } = request.query;

      const unusedAssetIds =
        await this.variantMediaManagementService.getUnusedAssets(productId);

      return ResponseHelper.ok(reply, "Unused assets retrieved successfully", {
        assets: unusedAssetIds,
        meta: {
          productId: productId || "all",
        },
      });
    } catch (error) {
      request.log.error(error, "Failed to get unused assets");

      if (error instanceof Error && error.message.includes("not found")) {
        return ResponseHelper.notFound(reply, "Product not found");
      }

      return ResponseHelper.error(reply, error);
    }
  }

  async validateVariantMedia(
    request: FastifyRequest<{ Params: { variantId: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const { variantId } = request.params;

      const validation =
        await this.variantMediaManagementService.validateVariantMedia(
          variantId,
        );

      return ResponseHelper.ok(reply, "Variant media validated successfully", validation);
    } catch (error) {
      request.log.error(error, "Failed to validate variant media");

      if (error instanceof Error && error.message.includes("not found")) {
        return ResponseHelper.notFound(reply, "Product variant not found");
      }

      return ResponseHelper.error(reply, error);
    }
  }

  async getVariantMediaStatistics(
    request: FastifyRequest<{ Params: { variantId: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const { variantId } = request.params;

      const statistics =
        await this.variantMediaManagementService.getVariantMediaStatistics(
          variantId,
        );

      return ResponseHelper.ok(reply, "Variant media statistics retrieved successfully", statistics);
    } catch (error) {
      request.log.error(error, "Failed to get variant media statistics");

      if (error instanceof Error && error.message.includes("not found")) {
        return ResponseHelper.notFound(reply, "Product variant not found");
      }

      return ResponseHelper.error(reply, error);
    }
  }
}
