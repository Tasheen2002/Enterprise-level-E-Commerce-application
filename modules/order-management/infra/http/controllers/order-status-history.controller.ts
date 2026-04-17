import { FastifyReply } from "fastify";
import { AuthenticatedRequest } from "@/api/src/shared/interfaces/authenticated-request.interface";
import { ResponseHelper } from "@/api/src/shared/response.helper";
import {
  LogOrderStatusChangeCommand,
  LogOrderStatusChangeCommandHandler,
  GetOrderStatusHistoryQuery,
  GetOrderStatusHistoryHandler,
} from "../../../application";

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
  constructor(
    private readonly logStatusChangeHandler: LogOrderStatusChangeCommandHandler,
    private readonly getStatusHistoryHandler: GetOrderStatusHistoryHandler,
  ) {}

  async logStatusChange(
    request: AuthenticatedRequest<LogStatusChangeRequest>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const command: LogOrderStatusChangeCommand = {
        orderId: request.params.orderId,
        fromStatus: request.body.fromStatus,
        toStatus: request.body.toStatus,
        changedBy: request.body.changedBy,
      };
      const result = await this.logStatusChangeHandler.handle(command);
      return ResponseHelper.fromCommand(reply, result, "Status change logged successfully", 201);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async getStatusHistory(
    request: AuthenticatedRequest<GetStatusHistoryRequest>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const query: GetOrderStatusHistoryQuery = {
        orderId: request.params.orderId,
        limit: request.query.limit,
        offset: request.query.offset,
      };
      const result = await this.getStatusHistoryHandler.handle(query);
      return ResponseHelper.ok(reply, "Status history retrieved successfully", result);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }
}
