import { FastifyReply } from "fastify";
import { AuthenticatedRequest } from "@/api/src/shared/interfaces/authenticated-request.interface";
import { ResponseHelper } from "@/api/src/shared/response.helper";
import {
  LogOrderEventHandler,
  ListOrderEventsHandler,
  GetOrderEventHandler,
} from "../../../application";
import {
  OrderEventsParams,
  OrderEventParams,
  ListOrderEventsQuery,
  LogOrderEventBody,
} from "../validation/order-event.schema";

export class OrderEventController {
  constructor(
    private readonly logEventHandler: LogOrderEventHandler,
    private readonly listOrderEventsHandler: ListOrderEventsHandler,
    private readonly getOrderEventHandler: GetOrderEventHandler,
  ) {}

  // ── Reads ──

  async getEvents(
    request: AuthenticatedRequest<{ Params: OrderEventsParams; Querystring: ListOrderEventsQuery }>,
    reply: FastifyReply,
  ) {
    try {
      const { eventType, limit, offset, sortBy, sortOrder } = request.query;
      const result = await this.listOrderEventsHandler.handle({
        orderId: request.params.orderId,
        eventType,
        limit,
        offset,
        sortBy,
        sortOrder,
      });
      return ResponseHelper.ok(reply, "Order events retrieved successfully", result);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async getEvent(
    request: AuthenticatedRequest<{ Params: OrderEventParams }>,
    reply: FastifyReply,
  ) {
    try {
      const result = await this.getOrderEventHandler.handle({
        orderId: request.params.orderId,
        eventId: request.params.eventId,
      });
      return ResponseHelper.ok(reply, "Order event retrieved successfully", result);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  // ── Writes ──

  async logEvent(
    request: AuthenticatedRequest<{ Params: OrderEventsParams; Body: LogOrderEventBody }>,
    reply: FastifyReply,
  ) {
    try {
      const result = await this.logEventHandler.handle({
        orderId: request.params.orderId,
        eventType: request.body.eventType,
        payload: request.body.payload,
        loggedBy: request.user.userId,
      });
      return ResponseHelper.fromCommand(reply, result, "Event logged successfully", 201);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }
}
