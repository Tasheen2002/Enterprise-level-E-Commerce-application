import { FastifyRequest, FastifyReply } from "fastify";
import {
  CreateStockAlertCommand,
  CreateStockAlertHandler,
  ResolveStockAlertCommand,
  ResolveStockAlertHandler,
  GetStockAlertQuery,
  GetStockAlertHandler,
  GetActiveAlertsQuery,
  GetActiveAlertsHandler,
  ListStockAlertsQuery,
  ListStockAlertsHandler,
} from "../../../application";
import { StockAlertService } from "../../../application/services/stock-alert.service";
import { ResponseHelper } from "@/api/src/shared/response.helper";

export interface ListAlertsQuerystring {
  limit?: number;
  offset?: number;
  includeResolved?: boolean | string;
}

export interface CreateAlertBody {
  variantId: string;
  type: string;
}

export class StockAlertController {
  private createAlertHandler: CreateStockAlertHandler;
  private resolveAlertHandler: ResolveStockAlertHandler;
  private getAlertHandler: GetStockAlertHandler;
  private getActiveAlertsHandler: GetActiveAlertsHandler;
  private listAlertsHandler: ListStockAlertsHandler;

  constructor(private readonly alertService: StockAlertService) {
    this.createAlertHandler = new CreateStockAlertHandler(alertService);
    this.resolveAlertHandler = new ResolveStockAlertHandler(alertService);
    this.getAlertHandler = new GetStockAlertHandler(alertService);
    this.getActiveAlertsHandler = new GetActiveAlertsHandler(alertService);
    this.listAlertsHandler = new ListStockAlertsHandler(alertService);
  }

  async getAlert(
    request: FastifyRequest<{ Params: { alertId: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const { alertId } = request.params;
      const query: GetStockAlertQuery = { alertId };
      const result = await this.getAlertHandler.handle(query);
      return ResponseHelper.fromQuery(
        reply,
        result,
        "Alert retrieved",
        "Alert not found",
      );
    } catch (error) {
      return ResponseHelper.error(reply, error);
    }
  }

  async getActiveAlerts(request: FastifyRequest, reply: FastifyReply) {
    try {
      const query: GetActiveAlertsQuery = {};
      const result = await this.getActiveAlertsHandler.handle(query);
      return ResponseHelper.fromQuery(reply, result, "Active alerts retrieved");
    } catch (error) {
      return ResponseHelper.error(reply, error);
    }
  }

  async listAlerts(
    request: FastifyRequest<{ Querystring: ListAlertsQuerystring }>,
    reply: FastifyReply,
  ) {
    try {
      const queryParams = request.query;
      let includeResolved: boolean | undefined = undefined;
      if (typeof queryParams.includeResolved !== "undefined") {
        if (typeof queryParams.includeResolved === "boolean") {
          includeResolved = queryParams.includeResolved;
        } else if (typeof queryParams.includeResolved === "string") {
          includeResolved =
            queryParams.includeResolved === "true" ||
            queryParams.includeResolved === "1";
        }
      }
      const query: ListStockAlertsQuery = {
        limit: queryParams.limit ? Number(queryParams.limit) : undefined,
        offset: queryParams.offset ? Number(queryParams.offset) : undefined,
        includeResolved,
      };
      const result = await this.listAlertsHandler.handle(query);
      return ResponseHelper.fromQuery(reply, result, "Alerts retrieved");
    } catch (error) {
      return ResponseHelper.error(reply, error);
    }
  }

  async createAlert(
    request: FastifyRequest<{ Body: CreateAlertBody }>,
    reply: FastifyReply,
  ) {
    try {
      const body = request.body;
      const command: CreateStockAlertCommand = {
        variantId: body.variantId,
        type: body.type,
      };

      const result = await this.createAlertHandler.handle(command);

      if (result.success && result.data) {
        const alert = result.data;
        return ResponseHelper.created(reply, "Alert created successfully", {
          alertId: alert.getAlertId().getValue(),
          variantId: alert.getVariantId(),
          type: alert.getType().getValue(),
        });
      }
      return ResponseHelper.badRequest(
        reply,
        result.error || "Failed to create alert",
      );
    } catch (error) {
      return ResponseHelper.error(reply, error);
    }
  }

  async resolveAlert(
    request: FastifyRequest<{ Params: { alertId: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const { alertId } = request.params;
      const command: ResolveStockAlertCommand = { alertId };

      const result = await this.resolveAlertHandler.handle(command);
      return ResponseHelper.fromCommand(
        reply,
        result,
        "Alert resolved successfully",
      );
    } catch (error) {
      return ResponseHelper.error(reply, error);
    }
  }
}
