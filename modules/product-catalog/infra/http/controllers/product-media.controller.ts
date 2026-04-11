import { FastifyReply } from "fastify";
import { AuthenticatedRequest } from "@/api/src/shared/interfaces/authenticated-request.interface";
import {
  ProductMediaManagementService,
  ProductMediaServiceQueryOptions,
  ProductMediaData,
  ProductMediaReorderData,
} from "../../../application/services/product-media-management.service";
import { ResponseHelper } from "@/api/src/shared/response.helper";

export interface AddMediaToProductRequest {
  assetId: string;
  position?: number;
  isCover?: boolean;
}

export interface SetProductCoverImageRequest {
  assetId: string;
}

export interface ReorderProductMediaRequest {
  reorderData: ProductMediaReorderData[];
}

interface MoveMediaPositionRequest {
  assetId: string;
  newPosition: number;
}

interface SetProductMediaRequest {
  mediaData: ProductMediaData[];
}

interface ProductMediaQueryParams extends ProductMediaServiceQueryOptions {}

export class ProductMediaController {
  constructor(
    private readonly productMediaManagementService: ProductMediaManagementService,
  ) {}

  async getProductMedia(
    request: AuthenticatedRequest<{
      Params: { productId: string };
      Querystring: ProductMediaQueryParams;
    }>,
    reply: FastifyReply,
  ) {
    try {
      const { productId } = request.params;
      const options = request.query;

      const productMedia =
        await this.productMediaManagementService.getProductMedia(
          productId,
          options,
        );

      return ResponseHelper.ok(reply, "Product media retrieved successfully", productMedia);
    } catch (error) {

      return ResponseHelper.error(reply, error);
    }
  }

  async addMediaToProduct(
    request: AuthenticatedRequest<{
      Params: { productId: string };
      Body: AddMediaToProductRequest;
    }>,
    reply: FastifyReply,
  ) {
    try {
      const { productId } = request.params;
      const { assetId, position, isCover } = request.body;

      const productMediaId =
        await this.productMediaManagementService.addMediaToProduct(
          productId,
          assetId,
          position,
          isCover,
        );

      return ResponseHelper.created(reply, "Media added to product successfully", { productMediaId });
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

  async removeMediaFromProduct(
    request: AuthenticatedRequest<{ Params: { productId: string; assetId: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const { productId, assetId } = request.params;

      await this.productMediaManagementService.removeMediaFromProduct(
        productId,
        assetId,
      );

      return ResponseHelper.noContent(reply);
    } catch (error) {

      return ResponseHelper.error(reply, error);
    }
  }

  async removeAllProductMedia(
    request: AuthenticatedRequest<{ Params: { productId: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const { productId } = request.params;

      await this.productMediaManagementService.removeAllProductMedia(productId);

      return ResponseHelper.noContent(reply);
    } catch (error) {

      return ResponseHelper.error(reply, error);
    }
  }

  async setProductCoverImage(
    request: AuthenticatedRequest<{
      Params: { productId: string };
      Body: SetProductCoverImageRequest;
    }>,
    reply: FastifyReply,
  ) {
    try {
      const { productId } = request.params;
      const { assetId } = request.body;

      await this.productMediaManagementService.setProductCoverImage(
        productId,
        assetId,
      );

      return ResponseHelper.noContent(reply);
    } catch (error) {

      return ResponseHelper.error(reply, error);
    }
  }

  async removeCoverImage(
    request: AuthenticatedRequest<{ Params: { productId: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const { productId } = request.params;

      await this.productMediaManagementService.removeCoverImage(productId);

      return ResponseHelper.noContent(reply);
    } catch (error) {

      return ResponseHelper.error(reply, error);
    }
  }

  async reorderProductMedia(
    request: AuthenticatedRequest<{
      Params: { productId: string };
      Body: ReorderProductMediaRequest;
    }>,
    reply: FastifyReply,
  ) {
    try {
      const { productId } = request.params;
      const { reorderData } = request.body;

      await this.productMediaManagementService.reorderProductMedia(
        productId,
        reorderData,
      );

      return ResponseHelper.noContent(reply);
    } catch (error) {

      return ResponseHelper.error(reply, error);
    }
  }

  async moveMediaPosition(
    request: AuthenticatedRequest<{
      Params: { productId: string };
      Body: MoveMediaPositionRequest;
    }>,
    reply: FastifyReply,
  ) {
    try {
      const { productId } = request.params;
      const { assetId, newPosition } = request.body;

      await this.productMediaManagementService.moveMediaPosition(
        productId,
        assetId,
        newPosition,
      );

      return ResponseHelper.ok(reply, "Media position updated successfully");
    } catch (error) {

      return ResponseHelper.error(reply, error);
    }
  }

  async setProductMedia(
    request: AuthenticatedRequest<{
      Params: { productId: string };
      Body: SetProductMediaRequest;
    }>,
    reply: FastifyReply,
  ) {
    try {
      const { productId } = request.params;
      const { mediaData } = request.body;

      await this.productMediaManagementService.setProductMedia(
        productId,
        mediaData,
      );

      return ResponseHelper.ok(reply, "Product media set successfully");
    } catch (error) {

      return ResponseHelper.error(reply, error);
    }
  }

  async duplicateProductMedia(
    request: AuthenticatedRequest<{
      Params: { sourceProductId: string; targetProductId: string };
    }>,
    reply: FastifyReply,
  ) {
    try {
      const { sourceProductId, targetProductId } = request.params;

      await this.productMediaManagementService.duplicateProductMedia(
        sourceProductId,
        targetProductId,
      );

      return ResponseHelper.ok(reply, "Product media duplicated successfully");
    } catch (error) {

      return ResponseHelper.error(reply, error);
    }
  }

  async getProductsUsingAsset(
    request: AuthenticatedRequest<{ Params: { assetId: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const { assetId } = request.params;

      const productIds =
        await this.productMediaManagementService.getProductsUsingAsset(assetId);

      return ResponseHelper.ok(reply, "Products using asset retrieved successfully", productIds);
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
        await this.productMediaManagementService.getAssetUsageCount(assetId);

      return ResponseHelper.ok(reply, "Asset usage count retrieved successfully", { assetId, usageCount });
    } catch (error) {

      return ResponseHelper.error(reply, error);
    }
  }

  async compactProductMediaPositions(
    request: AuthenticatedRequest<{ Params: { productId: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const { productId } = request.params;

      await this.productMediaManagementService.compactProductMediaPositions(
        productId,
      );

      return ResponseHelper.ok(reply, "Product media positions compacted successfully");
    } catch (error) {

      return ResponseHelper.error(reply, error);
    }
  }

  async validateProductMedia(
    request: AuthenticatedRequest<{ Params: { productId: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const { productId } = request.params;

      const validation =
        await this.productMediaManagementService.validateProductMedia(
          productId,
        );

      return ResponseHelper.ok(reply, "Product media validated successfully", validation);
    } catch (error) {

      return ResponseHelper.error(reply, error);
    }
  }

  async getProductMediaStatistics(
    request: AuthenticatedRequest<{ Params: { productId: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const { productId } = request.params;

      const statistics =
        await this.productMediaManagementService.getProductMediaStatistics(
          productId,
        );

      return ResponseHelper.ok(reply, "Product media statistics retrieved successfully", statistics);
    } catch (error) {

      return ResponseHelper.error(reply, error);
    }
  }
}
