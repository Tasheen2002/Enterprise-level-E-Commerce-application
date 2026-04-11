import { FastifyReply } from "fastify";
import { AuthenticatedRequest } from "@/api/src/shared/interfaces/authenticated-request.interface";
import {
  CreateStockAlertHandler,
  ResolveStockAlertHandler,
  GetStockAlertHandler,
  GetActiveAlertsHandler,
  ListStockAlertsHandler,
} from "../../../application";
import { StockAlertService } from "../../../application/services/stock-alert.service";
import { ResponseHelper } from "@/api/src/shared/response.helper";

export class StockAlertController {
  private createAlertHandler: CreateStockAlertHandler;
  private resolveAlertHandler: ResolveStockAlertHandler;
  private getAlertHandler: GetStockAlertHandler;
  private getActiveAlertsHandler: GetActiveAlertsHandler;
  private listAlertsHandler: ListStockAlertsHandler;

  constructor(alertService: StockAlertService) {
    this.createAlertHandler = new CreateStockAlertHandler(alertService);
    this.resolveAlertHandler = new ResolveStockAlertHandler(alertService);
    this.getAlertHandler = new GetStockAlertHandler(alertService);
    this.getActiveAlertsHandler = new GetActiveAlertsHandler(alertService);
    this.listAlertsHandler = new ListStockAlertsHandler(alertService);
  }

  async getAlert(
    request: AuthenticatedRequest<{
      Params: { alertId: string };
    }>,
    reply: FastifyReply,
  ) {
    try {
      const { alertId } = request.params;
      const result = await this.getAlertHandler.handle({ alertId });
      return ResponseHelper.fromQuery(reply, result, "Alert retrieved", "Alert not found");
    } catch (error) {
      return ResponseHelper.error(reply, error);
    }
  }

  async getActiveAlerts(_request: AuthenticatedRequest, reply: FastifyReply) {
    try {
      const result = await this.getActiveAlertsHandler.handle({});
      return ResponseHelper.fromQuery(reply, result, "Active alerts retrieved");
    } catch (error) {
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
      const { limit, offset, includeResolved } = request.query;
      const result = await this.listAlertsHandler.handle({
        limit: limit ? Number(limit) : undefined,
        offset: offset ? Number(offset) : undefined,
        includeResolved,
      });
      return ResponseHelper.fromQuery(reply, result, "Alerts retrieved");
    } catch (error) {
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
      if (result.success && result.data) {
        return ResponseHelper.created(reply, "Alert created successfully", result.data);
      }
      return ResponseHelper.badRequest(reply, result.error || "Failed to create alert");
    } catch (error) {
      return ResponseHelper.error(reply, error);
    }
  }

  async resolveAlert(
    request: AuthenticatedRequest<{
      Params: { alertId: string };
    }>,
    reply: FastifyReply,
  ) {
    try {
      const { alertId } = request.params;
      const result = await this.resolveAlertHandler.handle({ alertId });
      return ResponseHelper.fromCommand(reply, result, "Alert resolved successfully");
    } catch (error) {
      return ResponseHelper.error(reply, error);
    }
  }
}
