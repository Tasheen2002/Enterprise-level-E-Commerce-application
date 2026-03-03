import { FastifyRequest, FastifyReply } from "fastify";
import {
  ProductMediaManagementService,
  ProductMediaServiceQueryOptions,
  ProductMediaData,
  ProductMediaReorderData,
} from "../../../application/services/product-media-management.service";

interface AddMediaToProductRequest {
  assetId: string;
  position?: number;
  isCover?: boolean;
}

interface SetProductCoverImageRequest {
  assetId: string;
}

interface ReorderProductMediaRequest {
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

      if (!productId || typeof productId !== "string") {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: "Product ID is required and must be a valid string",
        });
      }

      const productMedia =
        await this.productMediaManagementService.getProductMedia(
          productId,
          options,
        );

      return reply.code(200).send({
        success: true,
        data: productMedia,
      });
    } catch (error) {
      request.log.error(error, "Failed to get product media");

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
        message: "Failed to retrieve product media",
      });
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

      if (!productId || typeof productId !== "string") {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: "Product ID is required and must be a valid string",
        });
      }

      if (!assetId || typeof assetId !== "string") {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: "Asset ID is required and must be a valid string",
        });
      }

      if (
        position !== undefined &&
        (typeof position !== "number" || position < 1)
      ) {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: "Position must be a positive number",
        });
      }

      const productMediaId =
        await this.productMediaManagementService.addMediaToProduct(
          productId,
          assetId,
          position,
          isCover,
        );

      return reply.code(201).send({
        success: true,
        data: { productMediaId },
        message: "Media added to product successfully",
      });
    } catch (error) {
      request.log.error(error, "Failed to add media to product");

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
        message: "Failed to add media to product",
      });
    }
  }

  async removeMediaFromProduct(
    request: FastifyRequest<{ Params: { productId: string; assetId: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const { productId, assetId } = request.params;

      if (!productId || typeof productId !== "string") {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: "Product ID is required and must be a valid string",
        });
      }

      if (!assetId || typeof assetId !== "string") {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: "Asset ID is required and must be a valid string",
        });
      }

      await this.productMediaManagementService.removeMediaFromProduct(
        productId,
        assetId,
      );

      return reply.code(200).send({
        success: true,
        message: "Media removed from product successfully",
      });
    } catch (error) {
      request.log.error(error, "Failed to remove media from product");

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
        message: "Failed to remove media from product",
      });
    }
  }

  async removeAllProductMedia(
    request: FastifyRequest<{ Params: { productId: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const { productId } = request.params;

      if (!productId || typeof productId !== "string") {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: "Product ID is required and must be a valid string",
        });
      }

      await this.productMediaManagementService.removeAllProductMedia(productId);

      return reply.code(200).send({
        success: true,
        message: "All media removed from product successfully",
      });
    } catch (error) {
      request.log.error(error, "Failed to remove all product media");

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
        message: "Failed to remove all product media",
      });
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

      if (!productId || typeof productId !== "string") {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: "Product ID is required and must be a valid string",
        });
      }

      if (!assetId || typeof assetId !== "string") {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: "Asset ID is required and must be a valid string",
        });
      }

      await this.productMediaManagementService.setProductCoverImage(
        productId,
        assetId,
      );

      return reply.code(200).send({
        success: true,
        message: "Product cover image set successfully",
      });
    } catch (error) {
      request.log.error(error, "Failed to set product cover image");

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
        message: "Failed to set product cover image",
      });
    }
  }

  async removeCoverImage(
    request: FastifyRequest<{ Params: { productId: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const { productId } = request.params;

      if (!productId || typeof productId !== "string") {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: "Product ID is required and must be a valid string",
        });
      }

      await this.productMediaManagementService.removeCoverImage(productId);

      return reply.code(200).send({
        success: true,
        message: "Product cover image removed successfully",
      });
    } catch (error) {
      request.log.error(error, "Failed to remove product cover image");

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
        message: "Failed to remove product cover image",
      });
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

      if (!productId || typeof productId !== "string") {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: "Product ID is required and must be a valid string",
        });
      }

      if (
        !reorderData ||
        !Array.isArray(reorderData) ||
        reorderData.length === 0
      ) {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: "Reorder data is required and must be a non-empty array",
        });
      }

      // Validate reorder data structure
      for (const item of reorderData) {
        if (!item.assetId || typeof item.assetId !== "string") {
          return reply.code(400).send({
            success: false,
            error: "Bad Request",
            message: "Each reorder item must have a valid assetId",
          });
        }

        if (typeof item.position !== "number" || item.position < 1) {
          return reply.code(400).send({
            success: false,
            error: "Bad Request",
            message:
              "Each reorder item must have a valid position (positive number)",
          });
        }
      }

      await this.productMediaManagementService.reorderProductMedia(
        productId,
        reorderData,
      );

      return reply.code(200).send({
        success: true,
        message: "Product media reordered successfully",
      });
    } catch (error) {
      request.log.error(error, "Failed to reorder product media");

      if (error instanceof Error && error.message.includes("not found")) {
        return reply.code(404).send({
          success: false,
          error: "Not Found",
          message: error.message,
        });
      }

      if (error instanceof Error && error.message.includes("not associated")) {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: error.message,
        });
      }

      return reply.code(500).send({
        success: false,
        error: "Internal server error",
        message: "Failed to reorder product media",
      });
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

      if (!productId || typeof productId !== "string") {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: "Product ID is required and must be a valid string",
        });
      }

      if (!assetId || typeof assetId !== "string") {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: "Asset ID is required and must be a valid string",
        });
      }

      if (typeof newPosition !== "number" || newPosition < 1) {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: "New position must be a positive number",
        });
      }

      await this.productMediaManagementService.moveMediaPosition(
        productId,
        assetId,
        newPosition,
      );

      return reply.code(200).send({
        success: true,
        message: "Media position updated successfully",
      });
    } catch (error) {
      request.log.error(error, "Failed to move media position");

      if (error instanceof Error && error.message.includes("not associated")) {
        return reply.code(404).send({
          success: false,
          error: "Not Found",
          message: error.message,
        });
      }

      if (
        error instanceof Error &&
        error.message.includes("Position must be greater than 0")
      ) {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: error.message,
        });
      }

      return reply.code(500).send({
        success: false,
        error: "Internal server error",
        message: "Failed to move media position",
      });
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

      if (!productId || typeof productId !== "string") {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: "Product ID is required and must be a valid string",
        });
      }

      if (!mediaData || !Array.isArray(mediaData)) {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: "Media data is required and must be an array",
        });
      }

      // Validate media data structure
      for (const item of mediaData) {
        if (!item.assetId || typeof item.assetId !== "string") {
          return reply.code(400).send({
            success: false,
            error: "Bad Request",
            message: "Each media item must have a valid assetId",
          });
        }

        if (
          item.position !== undefined &&
          (typeof item.position !== "number" || item.position < 1)
        ) {
          return reply.code(400).send({
            success: false,
            error: "Bad Request",
            message: "Position must be a positive number if provided",
          });
        }
      }

      // Ensure only one cover image
      const coverImages = mediaData.filter((item) => item.isCover);
      if (coverImages.length > 1) {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: "Only one media asset can be set as cover image",
        });
      }

      await this.productMediaManagementService.setProductMedia(
        productId,
        mediaData,
      );

      return reply.code(200).send({
        success: true,
        message: "Product media set successfully",
      });
    } catch (error) {
      request.log.error(error, "Failed to set product media");

      if (error instanceof Error && error.message.includes("not found")) {
        return reply.code(404).send({
          success: false,
          error: "Not Found",
          message: error.message,
        });
      }

      if (
        error instanceof Error &&
        error.message.includes("Only one media asset can be set as cover image")
      ) {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: error.message,
        });
      }

      return reply.code(500).send({
        success: false,
        error: "Internal server error",
        message: "Failed to set product media",
      });
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

      if (sourceProductId === targetProductId) {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: "Source and target product IDs must be different",
        });
      }

      await this.productMediaManagementService.duplicateProductMedia(
        sourceProductId,
        targetProductId,
      );

      return reply.code(200).send({
        success: true,
        message: "Product media duplicated successfully",
      });
    } catch (error) {
      request.log.error(error, "Failed to duplicate product media");

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
        message: "Failed to duplicate product media",
      });
    }
  }

  async getProductsUsingAsset(
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

      const productIds =
        await this.productMediaManagementService.getProductsUsingAsset(assetId);

      return reply.code(200).send({
        success: true,
        data: productIds,
      });
    } catch (error) {
      request.log.error(error, "Failed to get products using asset");

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
        message: "Failed to get products using asset",
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
        await this.productMediaManagementService.getAssetUsageCount(assetId);

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

  async compactProductMediaPositions(
    request: FastifyRequest<{ Params: { productId: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const { productId } = request.params;

      if (!productId || typeof productId !== "string") {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: "Product ID is required and must be a valid string",
        });
      }

      await this.productMediaManagementService.compactProductMediaPositions(
        productId,
      );

      return reply.code(200).send({
        success: true,
        message: "Product media positions compacted successfully",
      });
    } catch (error) {
      request.log.error(error, "Failed to compact product media positions");

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
        message: "Failed to compact product media positions",
      });
    }
  }

  async validateProductMedia(
    request: FastifyRequest<{ Params: { productId: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const { productId } = request.params;

      if (!productId || typeof productId !== "string") {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: "Product ID is required and must be a valid string",
        });
      }

      const validation =
        await this.productMediaManagementService.validateProductMedia(
          productId,
        );

      return reply.code(200).send({
        success: true,
        data: validation,
      });
    } catch (error) {
      request.log.error(error, "Failed to validate product media");

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
        message: "Failed to validate product media",
      });
    }
  }

  async getProductMediaStatistics(
    request: FastifyRequest<{ Params: { productId: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const { productId } = request.params;

      if (!productId || typeof productId !== "string") {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: "Product ID is required and must be a valid string",
        });
      }

      const statistics =
        await this.productMediaManagementService.getProductMediaStatistics(
          productId,
        );

      return reply.code(200).send({
        success: true,
        data: statistics,
      });
    } catch (error) {
      request.log.error(error, "Failed to get product media statistics");

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
        message: "Failed to get product media statistics",
      });
    }
  }
}
