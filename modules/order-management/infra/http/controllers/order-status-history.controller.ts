import { FastifyReply } from "fastify";
import { AuthenticatedRequest } from "@/api/src/shared/interfaces/authenticated-request.interface";
import { ResponseHelper } from "@/api/src/shared/response.helper";
import {
  LogOrderStatusChangeHandler,
  GetOrderStatusHistoryHandler,
} from "../../../application";
import {
  OrderStatusHistoryParams,
  GetStatusHistoryQuery,
  LogStatusChangeBody,
} from "../validation/order-status-history.schema";

export class OrderStatusHistoryController {
  constructor(
    private readonly logStatusChangeHandler: LogOrderStatusChangeHandler,
    private readonly getStatusHistoryHandler: GetOrderStatusHistoryHandler,
  ) {}

  async logStatusChange(
    request: AuthenticatedRequest<{ Params: OrderStatusHistoryParams; Body: LogStatusChangeBody }>,
    reply: FastifyReply,
  ) {
    try {
      const result = await this.logStatusChangeHandler.handle({
        orderId: request.params.orderId,
        ...request.body,
      });
      return ResponseHelper.fromCommand(reply, result, "Status change logged successfully", 201);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async getStatusHistory(
    request: AuthenticatedRequest<{ Params: OrderStatusHistoryParams; Querystring: GetStatusHistoryQuery }>,
    reply: FastifyReply,
  ) {
    try {
      const result = await this.getStatusHistoryHandler.handle({
        orderId: request.params.orderId,
        ...request.query,
      });
      return ResponseHelper.ok(reply, "Status history retrieved successfully", result);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }
}
