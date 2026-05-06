import { FastifyReply } from "fastify";
import { AuthenticatedRequest } from "@/api/src/shared/interfaces/authenticated-request.interface";
import { ResponseHelper } from "@/api/src/shared/response.helper";
import { hasRole, STAFF_ROLES } from "@/api/src/shared/middleware";
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

  // ── Reads ──

  async getStatusHistory(
    request: AuthenticatedRequest<{ Params: OrderStatusHistoryParams; Querystring: GetStatusHistoryQuery }>,
    reply: FastifyReply,
  ) {
    try {
      const result = await this.getStatusHistoryHandler.handle({
        orderId: request.params.orderId,
        limit: request.query.limit,
        offset: request.query.offset,
        requestingUserId: request.user.userId,
        isStaff: hasRole(request, [...STAFF_ROLES]),
      });
      return ResponseHelper.ok(reply, "Status history retrieved successfully", result);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  // ── Writes ──

  async logStatusChange(
    request: AuthenticatedRequest<{ Params: OrderStatusHistoryParams; Body: LogStatusChangeBody }>,
    reply: FastifyReply,
  ) {
    try {
      const result = await this.logStatusChangeHandler.handle({
        orderId: request.params.orderId,
        toStatus: request.body.toStatus,
        // Always derived from the authenticated session — never client-supplied —
        // so audit entries can't be spoofed.
        changedBy: request.user.userId,
      });
      return ResponseHelper.fromCommand(reply, result, "Status change logged successfully", 201);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }
}
