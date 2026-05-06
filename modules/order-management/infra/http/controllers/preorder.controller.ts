import { FastifyReply } from "fastify";
import { AuthenticatedRequest } from "@/api/src/shared/interfaces/authenticated-request.interface";
import { ResponseHelper } from "@/api/src/shared/response.helper";
import {
  CreatePreorderHandler,
  UpdatePreorderReleaseDateHandler,
  MarkPreorderNotifiedHandler,
  DeletePreorderHandler,
  GetPreorderHandler,
  ListPreordersHandler,
} from "../../../application";
import {
  PreorderParams,
  ListPreordersQuery,
  CreatePreorderBody,
  UpdatePreorderReleaseDateBody,
} from "../validation/preorder.schema";

export class PreorderController {
  constructor(
    private readonly createHandler: CreatePreorderHandler,
    private readonly updateReleaseDateHandler: UpdatePreorderReleaseDateHandler,
    private readonly markNotifiedHandler: MarkPreorderNotifiedHandler,
    private readonly deleteHandler: DeletePreorderHandler,
    private readonly getPreorderHandler: GetPreorderHandler,
    private readonly listPreordersHandler: ListPreordersHandler,
  ) {}

  // ── Reads ──

  async listPreorders(
    request: AuthenticatedRequest<{ Querystring: ListPreordersQuery }>,
    reply: FastifyReply,
  ) {
    try {
      const { limit, offset, sortBy, sortOrder, filterType } = request.query;
      const result = await this.listPreordersHandler.handle({
        limit,
        offset,
        sortBy,
        sortOrder,
        filterType,
      });
      return ResponseHelper.ok(reply, "Preorders retrieved successfully", result);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async getPreorder(
    request: AuthenticatedRequest<{ Params: PreorderParams }>,
    reply: FastifyReply,
  ) {
    try {
      const result = await this.getPreorderHandler.handle({ orderItemId: request.params.orderItemId });
      return ResponseHelper.ok(reply, "Preorder retrieved successfully", result);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  // ── Writes ──

  async createPreorder(
    request: AuthenticatedRequest<{ Body: CreatePreorderBody }>,
    reply: FastifyReply,
  ) {
    try {
      const result = await this.createHandler.handle({
        orderItemId: request.body.orderItemId,
        releaseDate: request.body.releaseDate,
      });
      return ResponseHelper.fromCommand(reply, result, "Preorder created successfully", 201);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async updateReleaseDate(
    request: AuthenticatedRequest<{ Params: PreorderParams; Body: UpdatePreorderReleaseDateBody }>,
    reply: FastifyReply,
  ) {
    try {
      const result = await this.updateReleaseDateHandler.handle({
        orderItemId: request.params.orderItemId,
        releaseDate: request.body.releaseDate,
      });
      return ResponseHelper.fromCommand(reply, result, "Preorder release date updated successfully");
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async markNotified(
    request: AuthenticatedRequest<{ Params: PreorderParams }>,
    reply: FastifyReply,
  ) {
    try {
      const result = await this.markNotifiedHandler.handle({ orderItemId: request.params.orderItemId });
      return ResponseHelper.fromCommand(reply, result, "Preorder marked as notified successfully");
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async deletePreorder(
    request: AuthenticatedRequest<{ Params: PreorderParams }>,
    reply: FastifyReply,
  ) {
    try {
      const result = await this.deleteHandler.handle({ orderItemId: request.params.orderItemId });
      return ResponseHelper.fromCommand(reply, result, "Preorder deleted successfully", undefined, 204);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }
}
