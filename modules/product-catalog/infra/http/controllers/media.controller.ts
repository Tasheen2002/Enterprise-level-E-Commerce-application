import { FastifyRequest, FastifyReply } from "fastify";
import { MediaManagementService } from "../../../application/services/media-management.service";
import { ResponseHelper } from "@/api/src/shared/response.helper";

export interface CreateMediaAssetRequest {
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

export interface UpdateMediaAssetRequest extends Partial<
  Omit<CreateMediaAssetRequest, "storageKey">
> {}

export interface MediaAssetQueryParams {
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

      return ResponseHelper.ok(reply, "Media assets retrieved successfully", {
        assets,
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
      return ResponseHelper.error(reply, error);
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
        return ResponseHelper.notFound(reply, "Media asset not found");
      }

      return ResponseHelper.ok(reply, "Media asset retrieved successfully", asset);
    } catch (error) {
      request.log.error(error, "Failed to get media asset");
      return ResponseHelper.error(reply, error);
    }
  }

  async createMediaAsset(
    request: FastifyRequest<{ Body: CreateMediaAssetRequest }>,
    reply: FastifyReply,
  ) {
    try {
      const assetData = request.body;

      const asset = await this.mediaManagementService.createAsset(assetData);

      return ResponseHelper.created(reply, "Media asset created successfully", asset);
    } catch (error) {
      request.log.error(error, "Failed to create media asset");

      if (
        error instanceof Error &&
        (error.message.includes("duplicate") ||
          error.message.includes("unique"))
      ) {
        return reply.status(409).send({
          success: false,
          statusCode: 409,
          error: "Conflict",
          message: "Media asset with this storage key already exists",
        });
      }

      return ResponseHelper.error(reply, error);
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

      const asset = await this.mediaManagementService.updateAsset(
        id,
        updateData,
      );

      if (!asset) {
        return ResponseHelper.notFound(reply, "Media asset not found");
      }

      return ResponseHelper.ok(reply, "Media asset updated successfully", asset);
    } catch (error) {
      request.log.error(error, "Failed to update media asset");
      return ResponseHelper.error(reply, error);
    }
  }

  async deleteMediaAsset(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const { id } = request.params;

      const deleted = await this.mediaManagementService.deleteAsset(id);

      if (!deleted) {
        return ResponseHelper.notFound(reply, "Media asset not found");
      }

      return ResponseHelper.ok(reply, "Media asset deleted successfully");
    } catch (error) {
      request.log.error(error, "Failed to delete media asset");

      if (
        error instanceof Error &&
        (error.message.includes("constraint") ||
          error.message.includes("foreign key"))
      ) {
        return reply.status(409).send({
          success: false,
          statusCode: 409,
          error: "Conflict",
          message: "Cannot delete media asset that is associated with products or variants",
        });
      }

      return ResponseHelper.error(reply, error);
    }
  }
}
