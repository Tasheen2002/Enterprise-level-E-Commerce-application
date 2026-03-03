import { FastifyRequest, FastifyReply } from "fastify";
import {
  LogOrderStatusChangeCommandHandler,
  GetOrderStatusHistoryHandler,
  OrderManagementService,
} from "../../../application";

interface LogStatusChangeRequest {
  Params: { orderId: string };
  Body: {
    fromStatus?: string;
    toStatus: string;
    changedBy?: string;
  };
}

interface GetStatusHistoryRequest {
  Params: { orderId: string };
  Querystring: {
    limit?: number;
    offset?: number;
  };
}

export class OrderStatusHistoryController {
  private logStatusChangeHandler: LogOrderStatusChangeCommandHandler;
  private getStatusHistoryHandler: GetOrderStatusHistoryHandler;

  constructor(orderService: OrderManagementService) {
    this.logStatusChangeHandler = new LogOrderStatusChangeCommandHandler(orderService);
    this.getStatusHistoryHandler = new GetOrderStatusHistoryHandler(orderService);
  }

  async logStatusChange(
    request: FastifyRequest<LogStatusChangeRequest>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const { orderId } = request.params;
      const { fromStatus, toStatus, changedBy } = request.body;

      const result = await this.logStatusChangeHandler.handle({
        orderId,
        fromStatus,
        toStatus,
        changedBy,
      });

      if (result.success) {
        return reply.code(201).send({
          success: true,
          data: result.data?.toSnapshot(),
          message: "Status change logged successfully",
        });
      } else {
        return reply.code(400).send({
          success: false,
          error: result.error,
          errors: result.errors,
        });
      }
    } catch (error) {
      request.log.error(error, "Failed to log status change");
      return reply.code(500).send({
        success: false,
        error: "Internal server error",
      });
    }
  }

  async getStatusHistory(
    request: FastifyRequest<GetStatusHistoryRequest>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const { orderId } = request.params;
      const { limit, offset } = request.query;

      const result = await this.getStatusHistoryHandler.handle({
        orderId,
        limit,
        offset,
      });

      if (result.success) {
        return reply.code(200).send({
          success: true,
          data: result.data,
        });
      } else {
        return reply.code(404).send({
          success: false,
          error: result.error,
        });
      }
    } catch (error) {
      request.log.error(error, "Failed to get status history");
      return reply.code(500).send({
        success: false,
        error: "Internal server error",
      });
    }
  }
}
