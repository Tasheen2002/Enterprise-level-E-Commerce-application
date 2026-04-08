import { FastifyRequest, FastifyReply } from "fastify";
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
    request: FastifyRequest<{
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
      request.log.error(error, "Failed to get product media");

      if (error instanceof Error && error.message.includes("not found")) {
        return ResponseHelper.notFound(reply, "Product not found");
      }

      return ResponseHelper.error(reply, error);
    }
  }

  async addMediaToProduct(
    request: FastifyRequest<{
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
      request.log.error(error, "Failed to add media to product");

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

  async removeMediaFromProduct(
    request: FastifyRequest<{ Params: { productId: string; assetId: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const { productId, assetId } = request.params;

      await this.productMediaManagementService.removeMediaFromProduct(
        productId,
        assetId,
      );

      return ResponseHelper.ok(reply, "Media removed from product successfully");
    } catch (error) {
      request.log.error(error, "Failed to remove media from product");

      if (error instanceof Error && error.message.includes("not associated")) {
        return ResponseHelper.notFound(reply, error.message);
      }

      return ResponseHelper.error(reply, error);
    }
  }

  async removeAllProductMedia(
    request: FastifyRequest<{ Params: { productId: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const { productId } = request.params;

      await this.productMediaManagementService.removeAllProductMedia(productId);

      return ResponseHelper.ok(reply, "All media removed from product successfully");
    } catch (error) {
      request.log.error(error, "Failed to remove all product media");

      if (error instanceof Error && error.message.includes("not found")) {
        return ResponseHelper.notFound(reply, "Product not found");
      }

      return ResponseHelper.error(reply, error);
    }
  }

  async setProductCoverImage(
    request: FastifyRequest<{
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

      return ResponseHelper.ok(reply, "Product cover image set successfully");
    } catch (error) {
      request.log.error(error, "Failed to set product cover image");

      if (error instanceof Error && error.message.includes("not associated")) {
        return ResponseHelper.notFound(reply, error.message);
      }

      return ResponseHelper.error(reply, error);
    }
  }

  async removeCoverImage(
    request: FastifyRequest<{ Params: { productId: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const { productId } = request.params;

      await this.productMediaManagementService.removeCoverImage(productId);

      return ResponseHelper.ok(reply, "Product cover image removed successfully");
    } catch (error) {
      request.log.error(error, "Failed to remove product cover image");

      if (error instanceof Error && error.message.includes("not found")) {
        return ResponseHelper.notFound(reply, "Product not found");
      }

      return ResponseHelper.error(reply, error);
    }
  }

  async reorderProductMedia(
    request: FastifyRequest<{
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

      return ResponseHelper.ok(reply, "Product media reordered successfully");
    } catch (error) {
      request.log.error(error, "Failed to reorder product media");

      if (error instanceof Error && error.message.includes("not found")) {
        return ResponseHelper.notFound(reply, error.message);
      }

      if (error instanceof Error && error.message.includes("not associated")) {
        return ResponseHelper.badRequest(reply, error.message);
      }

      return ResponseHelper.error(reply, error);
    }
  }

  async moveMediaPosition(
    request: FastifyRequest<{
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
      request.log.error(error, "Failed to move media position");

      if (error instanceof Error && error.message.includes("not associated")) {
        return ResponseHelper.notFound(reply, error.message);
      }

      if (
        error instanceof Error &&
        error.message.includes("Position must be greater than 0")
      ) {
        return ResponseHelper.badRequest(reply, error.message);
      }

      return ResponseHelper.error(reply, error);
    }
  }

  async setProductMedia(
    request: FastifyRequest<{
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
      request.log.error(error, "Failed to set product media");

      if (error instanceof Error && error.message.includes("not found")) {
        return ResponseHelper.notFound(reply, error.message);
      }

      if (
        error instanceof Error &&
        error.message.includes("Only one media asset can be set as cover image")
      ) {
        return ResponseHelper.badRequest(reply, error.message);
      }

      return ResponseHelper.error(reply, error);
    }
  }

  async duplicateProductMedia(
    request: FastifyRequest<{
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
      request.log.error(error, "Failed to duplicate product media");

      if (error instanceof Error && error.message.includes("not found")) {
        return ResponseHelper.notFound(reply, error.message);
      }

      return ResponseHelper.error(reply, error);
    }
  }

  async getProductsUsingAsset(
    request: FastifyRequest<{ Params: { assetId: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const { assetId } = request.params;

      const productIds =
        await this.productMediaManagementService.getProductsUsingAsset(assetId);

      return ResponseHelper.ok(reply, "Products using asset retrieved successfully", productIds);
    } catch (error) {
      request.log.error(error, "Failed to get products using asset");

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
        await this.productMediaManagementService.getAssetUsageCount(assetId);

      return ResponseHelper.ok(reply, "Asset usage count retrieved successfully", { assetId, usageCount });
    } catch (error) {
      request.log.error(error, "Failed to get asset usage count");

      if (error instanceof Error && error.message.includes("not found")) {
        return ResponseHelper.notFound(reply, "Media asset not found");
      }

      return ResponseHelper.error(reply, error);
    }
  }

  async compactProductMediaPositions(
    request: FastifyRequest<{ Params: { productId: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const { productId } = request.params;

      await this.productMediaManagementService.compactProductMediaPositions(
        productId,
      );

      return ResponseHelper.ok(reply, "Product media positions compacted successfully");
    } catch (error) {
      request.log.error(error, "Failed to compact product media positions");

      if (error instanceof Error && error.message.includes("not found")) {
        return ResponseHelper.notFound(reply, "Product not found");
      }

      return ResponseHelper.error(reply, error);
    }
  }

  async validateProductMedia(
    request: FastifyRequest<{ Params: { productId: string } }>,
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
      request.log.error(error, "Failed to validate product media");

      if (error instanceof Error && error.message.includes("not found")) {
        return ResponseHelper.notFound(reply, "Product not found");
      }

      return ResponseHelper.error(reply, error);
    }
  }

  async getProductMediaStatistics(
    request: FastifyRequest<{ Params: { productId: string } }>,
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
      request.log.error(error, "Failed to get product media statistics");

      if (error instanceof Error && error.message.includes("not found")) {
        return ResponseHelper.notFound(reply, "Product not found");
      }

      return ResponseHelper.error(reply, error);
    }
  }
}
