import { FastifyReply } from "fastify";
import { AuthenticatedRequest } from "@/api/src/shared/interfaces/authenticated-request.interface";
import {
  VariantMediaManagementService,
  VariantMediaServiceQueryOptions,
} from "../../../application/services/variant-media-management.service";
import { ResponseHelper } from "@/api/src/shared/response.helper";

export interface AddMediaToVariantRequest {
  assetId: string;
}

export interface SetVariantMediaRequest {
  assetIds: string[];
}

export interface AddMediaToMultipleVariantsRequest {
  variantIds: string[];
  assetId: string;
}

export interface AddMultipleMediaToVariantRequest {
  variantId: string;
  assetIds: string[];
}

export interface CopyProductVariantMediaRequest {
  sourceProductId: string;
  targetProductId: string;
  variantMapping: Record<string, string>;
}

export interface VariantMediaQueryParams extends VariantMediaServiceQueryOptions {}

export class VariantMediaController {
  constructor(
    private readonly variantMediaManagementService: VariantMediaManagementService,
  ) {}

  async getVariantMedia(
    request: AuthenticatedRequest<{ Params: { variantId: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const { variantId } = request.params;

      const variantMedia =
        await this.variantMediaManagementService.getVariantMedia(variantId);

      return ResponseHelper.ok(
        reply,
        "Variant media retrieved successfully",
        variantMedia,
      );
    } catch (error) {

      return ResponseHelper.error(reply, error);
    }
  }

  async addMediaToVariant(
    request: AuthenticatedRequest<{
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

      return ResponseHelper.created(
        reply,
        "Media added to variant successfully",
      );
    } catch (error) {

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
    request: AuthenticatedRequest<{ Params: { variantId: string; assetId: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const { variantId, assetId } = request.params;

      await this.variantMediaManagementService.removeMediaFromVariant(
        variantId,
        assetId,
      );

      return ResponseHelper.noContent(reply);
    } catch (error) {

      return ResponseHelper.error(reply, error);
    }
  }

  async removeAllVariantMedia(
    request: AuthenticatedRequest<{ Params: { variantId: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const { variantId } = request.params;

      await this.variantMediaManagementService.removeAllVariantMedia(variantId);

      return ResponseHelper.noContent(reply);
    } catch (error) {

      return ResponseHelper.error(reply, error);
    }
  }

  async setVariantMedia(
    request: AuthenticatedRequest<{
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

      return ResponseHelper.noContent(reply);
    } catch (error) {

      return ResponseHelper.error(reply, error);
    }
  }

  async addMediaToMultipleVariants(
    request: AuthenticatedRequest<{ Body: AddMediaToMultipleVariantsRequest }>,
    reply: FastifyReply,
  ) {
    try {
      const { variantIds, assetId } = request.body;

      await this.variantMediaManagementService.addMediaToMultipleVariants(
        variantIds,
        assetId,
      );

      return ResponseHelper.created(
        reply,
        `Media added to ${variantIds.length} variants successfully`,
      );
    } catch (error) {

      return ResponseHelper.error(reply, error);
    }
  }

  async addMultipleMediaToVariant(
    request: AuthenticatedRequest<{
      Params: { variantId: string };
      Body: { assetIds: string[] };
    }>,
    reply: FastifyReply,
  ) {
    try {
      const { variantId } = request.params;
      const { assetIds } = request.body;

      await this.variantMediaManagementService.addMultipleMediaToVariant(
        variantId,
        assetIds,
      );

      return ResponseHelper.created(
        reply,
        `${assetIds.length} media assets added to variant successfully`,
      );
    } catch (error) {

      return ResponseHelper.error(reply, error);
    }
  }

  async duplicateVariantMedia(
    request: AuthenticatedRequest<{
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

      return ResponseHelper.noContent(reply);
    } catch (error) {

      return ResponseHelper.error(reply, error);
    }
  }

  async getProductVariantMedia(
    request: AuthenticatedRequest<{
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

      return ResponseHelper.ok(
        reply,
        "Product variant media retrieved successfully",
        productVariantMedia,
      );
    } catch (error) {

      return ResponseHelper.error(reply, error);
    }
  }

  async copyProductVariantMedia(
    request: AuthenticatedRequest<{ Body: CopyProductVariantMediaRequest }>,
    reply: FastifyReply,
  ) {
    try {
      const { sourceProductId, targetProductId, variantMapping } = request.body;

      await this.variantMediaManagementService.copyProductVariantMedia(
        sourceProductId,
        targetProductId,
        variantMapping,
      );

      return ResponseHelper.noContent(reply);
    } catch (error) {

      return ResponseHelper.error(reply, error);
    }
  }

  async getVariantsUsingAsset(
    request: AuthenticatedRequest<{ Params: { assetId: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const { assetId } = request.params;

      const variantIds =
        await this.variantMediaManagementService.getVariantsUsingAsset(assetId);

      return ResponseHelper.ok(
        reply,
        "Variants using asset retrieved successfully",
        variantIds,
      );
    } catch (error) {

      return ResponseHelper.error(reply, error);
    }
  }

  async getAssetUsageCount(
    request: AuthenticatedRequest<{ Params: { assetId: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const { assetId } = request.params;

      const usageCount =
        await this.variantMediaManagementService.getAssetUsageCount(assetId);

      return ResponseHelper.ok(
        reply,
        "Asset usage count retrieved successfully",
        { assetId, usageCount },
      );
    } catch (error) {

      return ResponseHelper.error(reply, error);
    }
  }

  async getColorVariantMedia(
    request: AuthenticatedRequest<{ Params: { productId: string; color: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const { productId, color } = request.params;

      const colorVariantMedia =
        await this.variantMediaManagementService.getColorVariantMedia(
          productId,
          decodeURIComponent(color),
        );

      return ResponseHelper.ok(
        reply,
        "Color variant media retrieved successfully",
        colorVariantMedia,
      );
    } catch (error) {

      return ResponseHelper.error(reply, error);
    }
  }

  async getSizeVariantMedia(
    request: AuthenticatedRequest<{ Params: { productId: string; size: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const { productId, size } = request.params;

      const sizeVariantMedia =
        await this.variantMediaManagementService.getSizeVariantMedia(
          productId,
          decodeURIComponent(size),
        );

      return ResponseHelper.ok(
        reply,
        "Size variant media retrieved successfully",
        sizeVariantMedia,
      );
    } catch (error) {

      return ResponseHelper.error(reply, error);
    }
  }

  async getUnusedAssets(
    request: AuthenticatedRequest<{ Querystring: { productId?: string } }>,
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

      return ResponseHelper.error(reply, error);
    }
  }

  async validateVariantMedia(
    request: AuthenticatedRequest<{ Params: { variantId: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const { variantId } = request.params;

      const validation =
        await this.variantMediaManagementService.validateVariantMedia(
          variantId,
        );

      return ResponseHelper.ok(
        reply,
        "Variant media validated successfully",
        validation,
      );
    } catch (error) {

      return ResponseHelper.error(reply, error);
    }
  }

  async getVariantMediaStatistics(
    request: AuthenticatedRequest<{ Params: { variantId: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const { variantId } = request.params;

      const statistics =
        await this.variantMediaManagementService.getVariantMediaStatistics(
          variantId,
        );

      return ResponseHelper.ok(
        reply,
        "Variant media statistics retrieved successfully",
        statistics,
      );
    } catch (error) {

      return ResponseHelper.error(reply, error);
    }
  }
}
