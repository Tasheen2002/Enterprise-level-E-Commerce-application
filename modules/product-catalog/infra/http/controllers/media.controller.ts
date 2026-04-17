import { FastifyReply } from "fastify";
import { AuthenticatedRequest } from "@/api/src/shared/interfaces/authenticated-request.interface";
import {
  CreateMediaAssetHandler,
  UpdateMediaAssetHandler,
  DeleteMediaAssetHandler,
  GetMediaAssetHandler,
  SearchMediaAssetsHandler,
} from "../../../application";
import { ResponseHelper } from "@/api/src/shared/response.helper";

export class MediaController {
  constructor(
    private readonly createMediaAssetHandler: CreateMediaAssetHandler,
    private readonly updateMediaAssetHandler: UpdateMediaAssetHandler,
    private readonly deleteMediaAssetHandler: DeleteMediaAssetHandler,
    private readonly getMediaAssetHandler: GetMediaAssetHandler,
    private readonly searchMediaAssetsHandler: SearchMediaAssetsHandler,
  ) {}

  async getMediaAssets(
    request: AuthenticatedRequest<{
      Querystring: {
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
      };
    }>,
    reply: FastifyReply,
  ) {
    try {
      const result = await this.searchMediaAssetsHandler.handle(request.query);
      return ResponseHelper.ok(reply, "Media assets retrieved successfully", result);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async getMediaAsset(
    request: AuthenticatedRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const asset = await this.getMediaAssetHandler.handle({ id: request.params.id });
      return ResponseHelper.ok(reply, "Media asset retrieved successfully", asset);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async createMediaAsset(
    request: AuthenticatedRequest<{
      Body: {
        storageKey: string;
        mime: string;
        width?: number;
        height?: number;
        bytes?: number;
        altText?: string;
        focalX?: number;
        focalY?: number;
        renditions?: Record<string, unknown>;
      };
    }>,
    reply: FastifyReply,
  ) {
    try {
      const result = await this.createMediaAssetHandler.handle(request.body);
      return ResponseHelper.fromCommand(reply, result, "Media asset created successfully", 201);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async updateMediaAsset(
    request: AuthenticatedRequest<{
      Params: { id: string };
      Body: {
        mime?: string;
        width?: number;
        height?: number;
        bytes?: number;
        altText?: string;
        focalX?: number;
        focalY?: number;
        renditions?: Record<string, unknown>;
      };
    }>,
    reply: FastifyReply,
  ) {
    try {
      const result = await this.updateMediaAssetHandler.handle({ id: request.params.id, ...request.body });
      return ResponseHelper.fromCommand(reply, result, "Media asset updated successfully");
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async deleteMediaAsset(
    request: AuthenticatedRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const result = await this.deleteMediaAssetHandler.handle({ id: request.params.id });
      return ResponseHelper.fromCommand(reply, result, "Media asset deleted successfully", undefined, 204);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }
}
