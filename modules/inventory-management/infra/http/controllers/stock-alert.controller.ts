import { FastifyReply } from "fastify";
import { AuthenticatedRequest } from "@/api/src/shared/interfaces/authenticated-request.interface";
import {
  CreateStockAlertHandler,
  ResolveStockAlertHandler,
  DeleteStockAlertHandler,
  GetStockAlertHandler,
  GetActiveAlertsHandler,
  ListStockAlertsHandler,
} from "../../../application";
import { ResponseHelper } from "@/api/src/shared/response.helper";
import {
  CreateStockAlertBody,
  ListStockAlertsQuery,
} from "../validation/stock-alert.schema";

export class StockAlertController {
  constructor(
    private readonly createAlertHandler: CreateStockAlertHandler,
    private readonly resolveAlertHandler: ResolveStockAlertHandler,
    private readonly deleteAlertHandler: DeleteStockAlertHandler,
    private readonly getAlertHandler: GetStockAlertHandler,
    private readonly getActiveAlertsHandler: GetActiveAlertsHandler,
    private readonly listAlertsHandler: ListStockAlertsHandler,
  ) {}

  async getAlert(
    request: AuthenticatedRequest<{ Params: { alertId: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const { alertId } = request.params;
      const result = await this.getAlertHandler.handle({ alertId });
      return ResponseHelper.ok(reply, "Alert retrieved", result);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async getActiveAlerts(_request: AuthenticatedRequest, reply: FastifyReply) {
    try {
      const result = await this.getActiveAlertsHandler.handle({});
      return ResponseHelper.ok(reply, "Active alerts retrieved", result);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async listAlerts(
    request: AuthenticatedRequest<{ Querystring: ListStockAlertsQuery }>,
    reply: FastifyReply,
  ) {
    try {
      const { limit, offset, includeResolved } = request.query;
      const result = await this.listAlertsHandler.handle({ limit, offset, includeResolved });
      return ResponseHelper.ok(reply, "Alerts retrieved", result);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async createAlert(
    request: AuthenticatedRequest<{ Body: CreateStockAlertBody }>,
    reply: FastifyReply,
  ) {
    try {
      const { variantId, type } = request.body;
      const result = await this.createAlertHandler.handle({ variantId, type });
      return ResponseHelper.fromCommand(reply, result, "Alert created successfully", 201);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async resolveAlert(
    request: AuthenticatedRequest<{ Params: { alertId: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const { alertId } = request.params;
      const result = await this.resolveAlertHandler.handle({ alertId });
      return ResponseHelper.fromCommand(reply, result, "Alert resolved successfully");
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async deleteAlert(
    request: AuthenticatedRequest<{ Params: { alertId: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const { alertId } = request.params;
      const result = await this.deleteAlertHandler.handle({ alertId });
      return ResponseHelper.fromCommand(reply, result, "Alert deleted successfully", undefined, 204);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }
}
