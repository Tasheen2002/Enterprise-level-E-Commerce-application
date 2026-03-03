import { FastifyRequest, FastifyReply } from "fastify";
import {
  CreateStockAlertCommand,
  CreateStockAlertCommandHandler,
  ResolveStockAlertCommand,
  ResolveStockAlertCommandHandler,
  GetStockAlertQuery,
  GetStockAlertQueryHandler,
  GetActiveAlertsQuery,
  GetActiveAlertsQueryHandler,
  ListStockAlertsQuery,
  ListStockAlertsQueryHandler,
} from "../../../application";
import { StockAlertService } from "../../../application/services/stock-alert.service";

export class StockAlertController {
  private createAlertHandler: CreateStockAlertCommandHandler;
  private resolveAlertHandler: ResolveStockAlertCommandHandler;
  private getAlertHandler: GetStockAlertQueryHandler;
  private getActiveAlertsHandler: GetActiveAlertsQueryHandler;
  private listAlertsHandler: ListStockAlertsQueryHandler;

  constructor(private readonly alertService: StockAlertService) {
    this.createAlertHandler = new CreateStockAlertCommandHandler(alertService);
    this.resolveAlertHandler = new ResolveStockAlertCommandHandler(
      alertService,
    );
    this.getAlertHandler = new GetStockAlertQueryHandler(alertService);
    this.getActiveAlertsHandler = new GetActiveAlertsQueryHandler(alertService);
    this.listAlertsHandler = new ListStockAlertsQueryHandler(alertService);
  }

  async getAlert(
    request: FastifyRequest<{ Params: { alertId: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const { alertId } = request.params;
      const query: GetStockAlertQuery = { alertId };
      const result = await this.getAlertHandler.handle(query);

      if (result.success && result.data) {
        return reply.code(200).send({ success: true, data: result.data });
      } else if (result.success && result.data === null) {
        return reply
          .code(404)
          .send({ success: false, error: "Alert not found" });
      } else {
        return reply
          .code(400)
          .send({ success: false, error: result.error, errors: result.errors });
      }
    } catch (error) {
      request.log.error(error, "Failed to get alert");
      return reply
        .code(500)
        .send({ success: false, error: "Internal server error" });
    }
  }

  async getActiveAlerts(request: FastifyRequest, reply: FastifyReply) {
    try {
      const query: GetActiveAlertsQuery = {};
      const result = await this.getActiveAlertsHandler.handle(query);

      if (result.success && result.data) {
        return reply.code(200).send({ success: true, data: result.data });
      } else {
        return reply
          .code(400)
          .send({ success: false, error: result.error, errors: result.errors });
      }
    } catch (error) {
      request.log.error(error, "Failed to get active alerts");
      return reply
        .code(500)
        .send({ success: false, error: "Internal server error" });
    }
  }

  async listAlerts(request: FastifyRequest, reply: FastifyReply) {
    try {
      const queryParams = request.query as any;
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

      if (result.success && result.data) {
        return reply.code(200).send({ success: true, data: result.data });
      } else {
        return reply
          .code(400)
          .send({ success: false, error: result.error, errors: result.errors });
      }
    } catch (error) {
      request.log.error(error, "Failed to list alerts");
      return reply
        .code(500)
        .send({ success: false, error: "Internal server error" });
    }
  }

  async createAlert(request: FastifyRequest, reply: FastifyReply) {
    try {
      const body = request.body as any;
      const command: CreateStockAlertCommand = {
        variantId: body.variantId,
        type: body.type,
      };

      const result = await this.createAlertHandler.handle(command);

      if (result.success && result.data) {
        const alert = result.data;
        return reply.code(201).send({
          success: true,
          data: {
            alertId: alert.getAlertId().getValue(),
            variantId: alert.getVariantId(),
            type: alert.getType().getValue(),
          },
          message: "Alert created successfully",
        });
      } else {
        return reply
          .code(400)
          .send({ success: false, error: result.error, errors: result.errors });
      }
    } catch (error) {
      request.log.error(error, "Failed to create alert");
      return reply
        .code(500)
        .send({ success: false, error: "Internal server error" });
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

      if (result.success && result.data) {
        return reply
          .code(200)
          .send({ success: true, message: "Alert resolved successfully" });
      } else {
        return reply
          .code(400)
          .send({ success: false, error: result.error, errors: result.errors });
      }
    } catch (error) {
      request.log.error(error, "Failed to resolve alert");
      return reply
        .code(500)
        .send({ success: false, error: "Internal server error" });
    }
  }
}
