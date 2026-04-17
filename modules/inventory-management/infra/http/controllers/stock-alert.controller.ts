import { FastifyReply } from "fastify";
import { AuthenticatedRequest } from "@/api/src/shared/interfaces/authenticated-request.interface";
import {
  CreateStockAlertHandler,
  ResolveStockAlertHandler,
  GetStockAlertHandler,
  GetActiveAlertsHandler,
  ListStockAlertsHandler,
} from "../../../application";
import { ResponseHelper } from "@/api/src/shared/response.helper";

export class StockAlertController {
  constructor(
    private readonly createAlertHandler: CreateStockAlertHandler,
    private readonly resolveAlertHandler: ResolveStockAlertHandler,
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
      const result = await this.getActiveAlertsHandler.handle();
      return ResponseHelper.ok(reply, "Active alerts retrieved", result);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async listAlerts(
    request: AuthenticatedRequest<{
      Querystring: { limit?: number; offset?: number; includeResolved?: boolean };
    }>,
    reply: FastifyReply,
  ) {
    try {
      const result = await this.listAlertsHandler.handle(request.query);
      return ResponseHelper.ok(reply, "Alerts retrieved", result);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async createAlert(
    request: AuthenticatedRequest<{
      Body: { variantId: string; type: string };
    }>,
    reply: FastifyReply,
  ) {
    try {
      const result = await this.createAlertHandler.handle(request.body);
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
}
