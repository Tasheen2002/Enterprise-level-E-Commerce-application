import { FastifyRequest, FastifyReply } from "fastify";
import {
  LogOrderStatusChangeCommandHandler,
  GetOrderStatusHistoryHandler,
  OrderManagementService,
} from "../../../application";
import { ResponseHelper } from "@/api/src/shared/response.helper";

export interface LogStatusChangeRequest {
  Params: { orderId: string };
  Body: {
    fromStatus?: string;
    toStatus: string;
    changedBy?: string;
  };
}

export interface GetStatusHistoryRequest {
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
    this.logStatusChangeHandler = new LogOrderStatusChangeCommandHandler(
      orderService,
    );
    this.getStatusHistoryHandler = new GetOrderStatusHistoryHandler(
      orderService,
    );
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

      return ResponseHelper.fromCommand(
        reply,
        result,
        "Status change logged successfully",
        201,
      );
    } catch (error) {
      return ResponseHelper.error(reply, error);
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

      return ResponseHelper.fromQuery(
        reply,
        result,
        "Status history retrieved",
      );
    } catch (error) {
      return ResponseHelper.error(reply, error);
    }
  }
}
