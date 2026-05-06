import { FastifyReply } from "fastify";
import { AuthenticatedRequest } from "@/api/src/shared/interfaces/authenticated-request.interface";
import { ResponseHelper } from "@/api/src/shared/response.helper";
import {
  CreateBackorderHandler,
  UpdateBackorderEtaHandler,
  MarkBackorderNotifiedHandler,
  DeleteBackorderHandler,
  GetBackorderHandler,
  ListBackordersHandler,
} from "../../../application";
import {
  BackorderParams,
  ListBackordersQuery,
  CreateBackorderBody,
  UpdateBackorderEtaBody,
} from "../validation/backorder.schema";

export class BackorderController {
  constructor(
    private readonly createHandler: CreateBackorderHandler,
    private readonly updateEtaHandler: UpdateBackorderEtaHandler,
    private readonly markNotifiedHandler: MarkBackorderNotifiedHandler,
    private readonly deleteHandler: DeleteBackorderHandler,
    private readonly getBackorderHandler: GetBackorderHandler,
    private readonly listBackordersHandler: ListBackordersHandler,
  ) {}

  // ── Reads ──

  async listBackorders(
    request: AuthenticatedRequest<{ Querystring: ListBackordersQuery }>,
    reply: FastifyReply,
  ) {
    try {
      const result = await this.listBackordersHandler.handle({
        limit: request.query.limit,
        offset: request.query.offset,
        sortBy: request.query.sortBy,
        sortOrder: request.query.sortOrder,
        filterType: request.query.filterType,
      });
      return ResponseHelper.ok(reply, "Backorders retrieved successfully", result);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async getBackorder(
    request: AuthenticatedRequest<{ Params: BackorderParams }>,
    reply: FastifyReply,
  ) {
    try {
      const result = await this.getBackorderHandler.handle({ orderItemId: request.params.orderItemId });
      return ResponseHelper.ok(reply, "Backorder retrieved successfully", result);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  // ── Writes ──

  async createBackorder(
    request: AuthenticatedRequest<{ Body: CreateBackorderBody }>,
    reply: FastifyReply,
  ) {
    try {
      const result = await this.createHandler.handle({
        orderItemId: request.body.orderItemId,
        promisedEta: request.body.promisedEta,
      });
      return ResponseHelper.fromCommand(reply, result, "Backorder created successfully", 201);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async updatePromisedEta(
    request: AuthenticatedRequest<{ Params: BackorderParams; Body: UpdateBackorderEtaBody }>,
    reply: FastifyReply,
  ) {
    try {
      const result = await this.updateEtaHandler.handle({
        orderItemId: request.params.orderItemId,
        promisedEta: request.body.promisedEta,
      });
      return ResponseHelper.fromCommand(reply, result, "Backorder promised ETA updated successfully");
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async markNotified(
    request: AuthenticatedRequest<{ Params: BackorderParams }>,
    reply: FastifyReply,
  ) {
    try {
      const result = await this.markNotifiedHandler.handle({ orderItemId: request.params.orderItemId });
      return ResponseHelper.fromCommand(reply, result, "Backorder marked as notified successfully");
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async deleteBackorder(
    request: AuthenticatedRequest<{ Params: BackorderParams }>,
    reply: FastifyReply,
  ) {
    try {
      const result = await this.deleteHandler.handle({ orderItemId: request.params.orderItemId });
      return ResponseHelper.fromCommand(reply, result, "Backorder deleted successfully", undefined, 204);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }
}
