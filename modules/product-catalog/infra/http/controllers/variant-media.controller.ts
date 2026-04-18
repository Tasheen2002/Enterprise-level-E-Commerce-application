import { FastifyReply } from "fastify";
import { AuthenticatedRequest } from "@/api/src/shared/interfaces/authenticated-request.interface";
import {
  AddMediaToVariantHandler,
  RemoveMediaFromVariantHandler,
  RemoveAllVariantMediaHandler,
  SetVariantMediaHandler,
  AddMediaToMultipleVariantsHandler,
  AddMultipleMediaToVariantHandler,
  DuplicateVariantMediaHandler,
  CopyProductVariantMediaHandler,
  GetVariantMediaHandler,
  GetProductVariantMediaHandler,
  GetVariantsUsingAssetHandler,
  GetVariantMediaAssetUsageCountHandler,
  GetColorVariantMediaHandler,
  GetSizeVariantMediaHandler,
  GetUnusedVariantMediaAssetsHandler,
  ValidateVariantMediaHandler,
  GetVariantMediaStatisticsHandler,
} from "../../../application";
import { ResponseHelper } from "@/api/src/shared/response.helper";
import {
  VariantMediaParams,
  VariantMediaAssetParams,
  AddMediaToVariantBody,
  SetVariantMediaBody,
  AddMultipleMediaToVariantBody,
  AddMediaToMultipleVariantsBody,
  CopyVariantMediaBody,
} from "../validation/variant-media.schema";

export class VariantMediaController {
  constructor(
    private readonly addMediaToVariantHandler: AddMediaToVariantHandler,
    private readonly removeMediaFromVariantHandler: RemoveMediaFromVariantHandler,
    private readonly removeAllVariantMediaHandler: RemoveAllVariantMediaHandler,
    private readonly setVariantMediaHandler: SetVariantMediaHandler,
    private readonly addMediaToMultipleVariantsHandler: AddMediaToMultipleVariantsHandler,
    private readonly addMultipleMediaToVariantHandler: AddMultipleMediaToVariantHandler,
    private readonly duplicateVariantMediaHandler: DuplicateVariantMediaHandler,
    private readonly copyProductVariantMediaHandler: CopyProductVariantMediaHandler,
    private readonly getVariantMediaHandler: GetVariantMediaHandler,
    private readonly getProductVariantMediaHandler: GetProductVariantMediaHandler,
    private readonly getVariantsUsingAssetHandler: GetVariantsUsingAssetHandler,
    private readonly getVariantMediaAssetUsageCountHandler: GetVariantMediaAssetUsageCountHandler,
    private readonly getColorVariantMediaHandler: GetColorVariantMediaHandler,
    private readonly getSizeVariantMediaHandler: GetSizeVariantMediaHandler,
    private readonly getUnusedVariantMediaAssetsHandler: GetUnusedVariantMediaAssetsHandler,
    private readonly validateVariantMediaHandler: ValidateVariantMediaHandler,
    private readonly getVariantMediaStatisticsHandler: GetVariantMediaStatisticsHandler,
  ) {}

  async getVariantMedia(
    request: AuthenticatedRequest<{ Params: VariantMediaParams }>,
    reply: FastifyReply,
  ) {
    try {
      const variantMedia = await this.getVariantMediaHandler.handle({ variantId: request.params.variantId });
      return ResponseHelper.ok(reply, "Variant media retrieved successfully", variantMedia);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async addMediaToVariant(
    request: AuthenticatedRequest<{ Params: VariantMediaParams; Body: AddMediaToVariantBody }>,
    reply: FastifyReply,
  ) {
    try {
      const result = await this.addMediaToVariantHandler.handle({
        variantId: request.params.variantId,
        assetId: request.body.assetId,
      });
      return ResponseHelper.fromCommand(reply, result, "Media added to variant successfully", 201);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async removeMediaFromVariant(
    request: AuthenticatedRequest<{ Params: VariantMediaAssetParams }>,
    reply: FastifyReply,
  ) {
    try {
      const result = await this.removeMediaFromVariantHandler.handle(request.params);
      return ResponseHelper.fromCommand(reply, result, "Media removed from variant successfully", undefined, 204);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async removeAllVariantMedia(
    request: AuthenticatedRequest<{ Params: VariantMediaParams }>,
    reply: FastifyReply,
  ) {
    try {
      const result = await this.removeAllVariantMediaHandler.handle({ variantId: request.params.variantId });
      return ResponseHelper.fromCommand(reply, result, "All variant media removed successfully", undefined, 204);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async setVariantMedia(
    request: AuthenticatedRequest<{ Params: VariantMediaParams; Body: SetVariantMediaBody }>,
    reply: FastifyReply,
  ) {
    try {
      const result = await this.setVariantMediaHandler.handle({
        variantId: request.params.variantId,
        assetIds: request.body.assetIds,
      });
      return ResponseHelper.fromCommand(reply, result, "Variant media set successfully", undefined, 204);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async addMediaToMultipleVariants(
    request: AuthenticatedRequest<{ Body: AddMediaToMultipleVariantsBody }>,
    reply: FastifyReply,
  ) {
    try {
      const result = await this.addMediaToMultipleVariantsHandler.handle(request.body);
      return ResponseHelper.fromCommand(reply, result, "Media added to variants successfully", 201);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async addMultipleMediaToVariant(
    request: AuthenticatedRequest<{ Params: VariantMediaParams; Body: AddMultipleMediaToVariantBody }>,
    reply: FastifyReply,
  ) {
    try {
      const result = await this.addMultipleMediaToVariantHandler.handle({
        variantId: request.params.variantId,
        assetIds: request.body.assetIds,
      });
      return ResponseHelper.fromCommand(reply, result, "Media assets added to variant successfully", 201);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async duplicateVariantMedia(
    request: AuthenticatedRequest<{ Params: { sourceVariantId: string; targetVariantId: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const result = await this.duplicateVariantMediaHandler.handle(request.params);
      return ResponseHelper.fromCommand(reply, result, "Variant media duplicated successfully", undefined, 204);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async getProductVariantMedia(
    request: AuthenticatedRequest<{
      Params: { productId: string };
      Querystring: { page?: number; limit?: number; sortBy?: "variantId" | "assetId"; sortOrder?: "asc" | "desc" };
    }>,
    reply: FastifyReply,
  ) {
    try {
      const productVariantMedia = await this.getProductVariantMediaHandler.handle({
        productId: request.params.productId,
        options: request.query,
      });
      return ResponseHelper.ok(reply, "Product variant media retrieved successfully", productVariantMedia);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async copyProductVariantMedia(
    request: AuthenticatedRequest<{ Body: CopyVariantMediaBody }>,
    reply: FastifyReply,
  ) {
    try {
      const result = await this.copyProductVariantMediaHandler.handle(request.body);
      return ResponseHelper.fromCommand(reply, result, "Product variant media copied successfully", undefined, 204);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async getVariantsUsingAsset(
    request: AuthenticatedRequest<{ Params: { assetId: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const variantIds = await this.getVariantsUsingAssetHandler.handle({ assetId: request.params.assetId });
      return ResponseHelper.ok(reply, "Variants using asset retrieved successfully", variantIds);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async getAssetUsageCount(
    request: AuthenticatedRequest<{ Params: { assetId: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const result = await this.getVariantMediaAssetUsageCountHandler.handle({ assetId: request.params.assetId });
      return ResponseHelper.ok(reply, "Asset usage count retrieved successfully", result);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async getColorVariantMedia(
    request: AuthenticatedRequest<{ Params: { productId: string; color: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const colorVariantMedia = await this.getColorVariantMediaHandler.handle(request.params);
      return ResponseHelper.ok(reply, "Color variant media retrieved successfully", colorVariantMedia);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async getSizeVariantMedia(
    request: AuthenticatedRequest<{ Params: { productId: string; size: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const sizeVariantMedia = await this.getSizeVariantMediaHandler.handle(request.params);
      return ResponseHelper.ok(reply, "Size variant media retrieved successfully", sizeVariantMedia);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async getUnusedAssets(
    request: AuthenticatedRequest<{ Querystring: { productId?: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const result = await this.getUnusedVariantMediaAssetsHandler.handle(request.query);
      return ResponseHelper.ok(reply, "Unused assets retrieved successfully", result);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async validateVariantMedia(
    request: AuthenticatedRequest<{ Params: VariantMediaParams }>,
    reply: FastifyReply,
  ) {
    try {
      const validation = await this.validateVariantMediaHandler.handle({ variantId: request.params.variantId });
      return ResponseHelper.ok(reply, "Variant media validated successfully", validation);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async getVariantMediaStatistics(
    request: AuthenticatedRequest<{ Params: VariantMediaParams }>,
    reply: FastifyReply,
  ) {
    try {
      const statistics = await this.getVariantMediaStatisticsHandler.handle({ variantId: request.params.variantId });
      return ResponseHelper.ok(reply, "Variant media statistics retrieved successfully", statistics);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }
}
