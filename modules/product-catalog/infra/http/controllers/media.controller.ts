import { FastifyRequest, FastifyReply } from "fastify";
import { MediaManagementService } from "../../../application/services/media-management.service";

interface CreateMediaAssetRequest {
  storageKey: string;
  mime: string;
  width?: number;
  height?: number;
  bytes?: number;
  altText?: string;
  focalX?: number;
  focalY?: number;
  renditions?: Record<string, any>;
}

interface UpdateMediaAssetRequest extends Partial<
  Omit<CreateMediaAssetRequest, "storageKey">
> {}

interface MediaAssetQueryParams {
  page?: number;
  limit?: number;
  mimeType?: string;
  isImage?: boolean;
  isVideo?: boolean;
  hasRenditions?: boolean;
  sortBy?: "createdAt" | "bytes" | "width" | "height" | "version";
  sortOrder?: "asc" | "desc";
  minBytes?: number;
  maxBytes?: number;
  minWidth?: number;
  maxWidth?: number;
  minHeight?: number;
  maxHeight?: number;
}

interface AddRenditionRequest {
  name: string;
  renditionData: any;
}

export class MediaController {
  constructor(
    private readonly mediaManagementService: MediaManagementService,
  ) {}

  async getMediaAssets(
    request: FastifyRequest<{ Querystring: MediaAssetQueryParams }>,
    reply: FastifyReply,
  ) {
    try {
      const {
        page = 1,
        limit = 20,
        mimeType,
        isImage,
        isVideo,
        hasRenditions,
        sortBy = "createdAt",
        sortOrder = "desc",
        minBytes,
        maxBytes,
        minWidth,
        maxWidth,
        minHeight,
        maxHeight,
      } = request.query;

      const options = {
        page: Math.max(1, page),
        limit: Math.min(100, Math.max(1, limit)),
        sortBy,
        sortOrder,
        hasRenditions,
      };

      // Use search assets with filters for more complex filtering
      const filters = {
        mimeType,
        isImage,
        isVideo,
        hasRenditions,
        minBytes,
        maxBytes,
        minWidth,
        maxWidth,
        minHeight,
        maxHeight,
      };

      const assets = await this.mediaManagementService.searchAssets(
        filters,
        options,
      );

      return reply.code(200).send({
        success: true,
        data: assets,
        meta: {
          page: options.page,
          limit: options.limit,
          sortBy: options.sortBy,
          sortOrder: options.sortOrder,
          filters: {
            mimeType,
            isImage,
            isVideo,
            hasRenditions,
            minBytes,
            maxBytes,
            minWidth,
            maxWidth,
            minHeight,
            maxHeight,
          },
        },
      });
    } catch (error) {
      request.log.error(error, "Failed to get media assets");
      return reply.code(500).send({
        success: false,
        error: "Internal server error",
        message: "Failed to retrieve media assets",
      });
    }
  }

  async getMediaAsset(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const { id } = request.params;

      if (!id || typeof id !== "string") {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: "Media asset ID is required and must be a valid string",
        });
      }

      const asset = await this.mediaManagementService.getAssetById(id);

      if (!asset) {
        return reply.code(404).send({
          success: false,
          error: "Not Found",
          message: "Media asset not found",
        });
      }

      return reply.code(200).send({
        success: true,
        data: asset,
      });
    } catch (error) {
      request.log.error(error, "Failed to get media asset");
      return reply.code(500).send({
        success: false,
        error: "Internal server error",
        message: "Failed to retrieve media asset",
      });
    }
  }

  async createMediaAsset(
    request: FastifyRequest<{ Body: CreateMediaAssetRequest }>,
    reply: FastifyReply,
  ) {
    try {
      const assetData = request.body;

      // Basic validation
      if (
        !assetData.storageKey ||
        typeof assetData.storageKey !== "string" ||
        assetData.storageKey.trim().length === 0
      ) {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: "Storage key is required and must be a non-empty string",
        });
      }

      if (
        !assetData.mime ||
        typeof assetData.mime !== "string" ||
        assetData.mime.trim().length === 0
      ) {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: "MIME type is required and must be a non-empty string",
        });
      }

      const asset = await this.mediaManagementService.createAsset(assetData);

      return reply.code(201).send({
        success: true,
        data: asset,
        message: "Media asset created successfully",
      });
    } catch (error) {
      request.log.error(error, "Failed to create media asset");
      console.log(
        "Media asset creation error:",
        error instanceof Error ? error.message : error,
      ); // Debug log

      if (
        error instanceof Error &&
        (error.message.includes("duplicate") ||
          error.message.includes("unique"))
      ) {
        return reply.code(409).send({
          success: false,
          error: "Conflict",
          message: "Media asset with this storage key already exists",
        });
      }

      // Return the actual error message for debugging
      return reply.code(500).send({
        success: false,
        error: "Internal server error",
        message:
          error instanceof Error
            ? error.message
            : "Failed to create media asset",
      });
    }
  }

  async updateMediaAsset(
    request: FastifyRequest<{
      Params: { id: string };
      Body: UpdateMediaAssetRequest;
    }>,
    reply: FastifyReply,
  ) {
    try {
      const { id } = request.params;
      const updateData = request.body;

      if (!id || typeof id !== "string") {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: "Media asset ID is required and must be a valid string",
        });
      }

      const asset = await this.mediaManagementService.updateAsset(
        id,
        updateData,
      );

      if (!asset) {
        return reply.code(404).send({
          success: false,
          error: "Not Found",
          message: "Media asset not found",
        });
      }

      return reply.code(200).send({
        success: true,
        data: asset,
        message: "Media asset updated successfully",
      });
    } catch (error) {
      request.log.error(error, "Failed to update media asset");

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
        message: "Failed to update media asset",
      });
    }
  }

  async deleteMediaAsset(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const { id } = request.params;

      if (!id || typeof id !== "string") {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: "Media asset ID is required and must be a valid string",
        });
      }

      const deleted = await this.mediaManagementService.deleteAsset(id);

      if (!deleted) {
        return reply.code(404).send({
          success: false,
          error: "Not Found",
          message: "Media asset not found",
        });
      }

      return reply.code(200).send({
        success: true,
        message: "Media asset deleted successfully",
      });
    } catch (error) {
      request.log.error(error, "Failed to delete media asset");

      if (error instanceof Error && error.message.includes("not found")) {
        return reply.code(404).send({
          success: false,
          error: "Not Found",
          message: "Media asset not found",
        });
      }

      if (
        error instanceof Error &&
        (error.message.includes("constraint") ||
          error.message.includes("foreign key"))
      ) {
        return reply.code(409).send({
          success: false,
          error: "Conflict",
          message:
            "Cannot delete media asset that is associated with products or variants",
        });
      }

      return reply.code(500).send({
        success: false,
        error: "Internal server error",
        message: "Failed to delete media asset",
      });
    }
  }
}
