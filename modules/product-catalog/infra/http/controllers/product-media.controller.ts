import { FastifyReply } from "fastify";
import { AuthenticatedRequest } from "@/api/src/shared/interfaces/authenticated-request.interface";
import {
  AddMediaToProductHandler,
  RemoveMediaFromProductHandler,
  RemoveAllProductMediaHandler,
  SetProductCoverImageHandler,
  RemoveCoverImageHandler,
  ReorderProductMediaHandler,
  SetProductMediaHandler,
  DuplicateProductMediaHandler,
  GetProductMediaHandler,
  GetProductsUsingAssetHandler,
  GetProductMediaAssetUsageCountHandler,
  ValidateProductMediaHandler,
  GetProductMediaStatisticsHandler,
} from "../../../application";
import { ResponseHelper } from "@/api/src/shared/response.helper";
import {
  ProductMediaParams,
  ProductMediaAssetParams,
  AssetIdParams,
  DuplicateProductMediaParams,
  GetProductMediaQuery,
  AddMediaToProductBody,
  SetProductCoverImageBody,
  ReorderProductMediaBody,
  SetProductMediaBody,
} from "../validation/product-media.schema";

export class ProductMediaController {
  constructor(
    private readonly addMediaToProductHandler: AddMediaToProductHandler,
    private readonly removeMediaFromProductHandler: RemoveMediaFromProductHandler,
    private readonly removeAllProductMediaHandler: RemoveAllProductMediaHandler,
    private readonly setProductCoverImageHandler: SetProductCoverImageHandler,
    private readonly removeCoverImageHandler: RemoveCoverImageHandler,
    private readonly reorderProductMediaHandler: ReorderProductMediaHandler,
    private readonly setProductMediaHandler: SetProductMediaHandler,
    private readonly duplicateProductMediaHandler: DuplicateProductMediaHandler,
    private readonly getProductMediaHandler: GetProductMediaHandler,
    private readonly getProductsUsingAssetHandler: GetProductsUsingAssetHandler,
    private readonly getProductMediaAssetUsageCountHandler: GetProductMediaAssetUsageCountHandler,
    private readonly validateProductMediaHandler: ValidateProductMediaHandler,
    private readonly getProductMediaStatisticsHandler: GetProductMediaStatisticsHandler,
  ) {}

  // ── Reads ──────────────────────────────────────────────────────────────

  async getProductMedia(
    request: AuthenticatedRequest<{ Params: ProductMediaParams; Querystring: GetProductMediaQuery }>,
    reply: FastifyReply,
  ) {
    try {
      const productMedia = await this.getProductMediaHandler.handle({
        productId: request.params.productId,
        options: request.query,
      });
      return ResponseHelper.ok(reply, "Product media retrieved successfully", productMedia);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async getProductsUsingAsset(
    request: AuthenticatedRequest<{ Params: AssetIdParams }>,
    reply: FastifyReply,
  ) {
    try {
      const productIds = await this.getProductsUsingAssetHandler.handle({
        assetId: request.params.assetId,
      });
      return ResponseHelper.ok(reply, "Products using asset retrieved successfully", productIds);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async getAssetUsageCount(
    request: AuthenticatedRequest<{ Params: AssetIdParams }>,
    reply: FastifyReply,
  ) {
    try {
      const result = await this.getProductMediaAssetUsageCountHandler.handle({
        assetId: request.params.assetId,
      });
      return ResponseHelper.ok(reply, "Asset usage count retrieved successfully", result);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async validateProductMedia(
    request: AuthenticatedRequest<{ Params: ProductMediaParams }>,
    reply: FastifyReply,
  ) {
    try {
      const validation = await this.validateProductMediaHandler.handle({
        productId: request.params.productId,
      });
      return ResponseHelper.ok(reply, "Product media validated successfully", validation);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async getProductMediaStatistics(
    request: AuthenticatedRequest<{ Params: ProductMediaParams }>,
    reply: FastifyReply,
  ) {
    try {
      const statistics = await this.getProductMediaStatisticsHandler.handle({
        productId: request.params.productId,
      });
      return ResponseHelper.ok(reply, "Product media statistics retrieved successfully", statistics);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  // ── Writes ─────────────────────────────────────────────────────────────

  async addMediaToProduct(
    request: AuthenticatedRequest<{ Params: ProductMediaParams; Body: AddMediaToProductBody }>,
    reply: FastifyReply,
  ) {
    try {
      const result = await this.addMediaToProductHandler.handle({
        productId: request.params.productId,
        assetId: request.body.assetId,
        position: request.body.position,
        isCover: request.body.isCover,
        alt: request.body.alt,
        caption: request.body.caption,
      });
      return ResponseHelper.fromCommand(reply, result, "Media added to product successfully", 201);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async setProductMedia(
    request: AuthenticatedRequest<{ Params: ProductMediaParams; Body: SetProductMediaBody }>,
    reply: FastifyReply,
  ) {
    try {
      const result = await this.setProductMediaHandler.handle({
        productId: request.params.productId,
        mediaData: request.body.mediaData,
      });
      return ResponseHelper.fromCommand(reply, result, "Product media set successfully");
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async duplicateProductMedia(
    request: AuthenticatedRequest<{ Params: DuplicateProductMediaParams }>,
    reply: FastifyReply,
  ) {
    try {
      const result = await this.duplicateProductMediaHandler.handle(request.params);
      return ResponseHelper.fromCommand(reply, result, "Product media duplicated successfully", 201);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async setProductCoverImage(
    request: AuthenticatedRequest<{ Params: ProductMediaParams; Body: SetProductCoverImageBody }>,
    reply: FastifyReply,
  ) {
    try {
      const result = await this.setProductCoverImageHandler.handle({
        productId: request.params.productId,
        assetId: request.body.assetId,
      });
      return ResponseHelper.fromCommand(reply, result, "Cover image set successfully", undefined, 204);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async reorderProductMedia(
    request: AuthenticatedRequest<{ Params: ProductMediaParams; Body: ReorderProductMediaBody }>,
    reply: FastifyReply,
  ) {
    try {
      const result = await this.reorderProductMediaHandler.handle({
        productId: request.params.productId,
        reorderData: request.body.reorderData,
      });
      return ResponseHelper.fromCommand(reply, result, "Product media reordered successfully", undefined, 204);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async removeMediaFromProduct(
    request: AuthenticatedRequest<{ Params: ProductMediaAssetParams }>,
    reply: FastifyReply,
  ) {
    try {
      const result = await this.removeMediaFromProductHandler.handle(request.params);
      return ResponseHelper.fromCommand(reply, result, "Media removed from product successfully", undefined, 204);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async removeAllProductMedia(
    request: AuthenticatedRequest<{ Params: ProductMediaParams }>,
    reply: FastifyReply,
  ) {
    try {
      const result = await this.removeAllProductMediaHandler.handle({
        productId: request.params.productId,
      });
      return ResponseHelper.fromCommand(reply, result, "All product media removed successfully", undefined, 204);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async removeCoverImage(
    request: AuthenticatedRequest<{ Params: ProductMediaParams }>,
    reply: FastifyReply,
  ) {
    try {
      const result = await this.removeCoverImageHandler.handle({
        productId: request.params.productId,
      });
      return ResponseHelper.fromCommand(reply, result, "Cover image removed successfully", undefined, 204);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }
}
