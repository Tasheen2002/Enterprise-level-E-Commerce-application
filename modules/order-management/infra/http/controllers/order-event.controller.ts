import { FastifyRequest, FastifyReply } from "fastify";
import {
  LogOrderEventCommandHandler,
  GetOrderEventsHandler,
  GetOrderEventHandler,
  OrderEventService,
} from "../../../application";
import { ResponseHelper } from "@/api/src/shared/response.helper";

export interface LogEventRequest {
  Params: { orderId: string };
  Body: {
    eventType: string;
    payload?: Record<string, any>;
  };
}

export interface GetEventsRequest {
  Params: { orderId: string };
  Querystring: {
    eventType?: string;
    limit?: number;
    offset?: number;
    sortBy?: "createdAt" | "eventId";
    sortOrder?: "asc" | "desc";
  };
}

export interface GetEventRequest {
  Params: {
    orderId: string;
    eventId: string;
  };
}

export class OrderEventController {
  private logEventHandler: LogOrderEventCommandHandler;
  private getOrderEventsHandler: GetOrderEventsHandler;
  private getOrderEventHandler: GetOrderEventHandler;

  constructor(orderEventService: OrderEventService) {
    this.logEventHandler = new LogOrderEventCommandHandler(orderEventService);
    this.getOrderEventsHandler = new GetOrderEventsHandler(orderEventService);
    this.getOrderEventHandler = new GetOrderEventHandler(orderEventService);
  }

  async logEvent(
    request: FastifyRequest<LogEventRequest>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const { orderId } = request.params;
      const { eventType, payload } = request.body;

      const result = await this.logEventHandler.handle({
        orderId,
        eventType,
        payload,
      });

      return ResponseHelper.fromCommand(
        reply,
        result,
        "Event logged successfully",
        201,
      );
    } catch (error) {
      return ResponseHelper.error(reply, error);
    }
  }

  async getEvents(
    request: FastifyRequest<GetEventsRequest>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const { orderId } = request.params;
      const { eventType, limit, offset, sortBy, sortOrder } = request.query;

      const result = await this.getOrderEventsHandler.handle({
        orderId,
        eventType,
        limit,
        offset,
        sortBy,
        sortOrder,
      });

      return ResponseHelper.fromQuery(reply, result, "Order events retrieved");
    } catch (error) {
      return ResponseHelper.error(reply, error);
    }
  }

  async getEvent(
    request: FastifyRequest<GetEventRequest>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const { eventId } = request.params;
      const eventIdNum = parseInt(eventId, 10);

      if (isNaN(eventIdNum)) {
        return ResponseHelper.badRequest(reply, "Invalid event ID");
      }

      const result = await this.getOrderEventHandler.handle({
        eventId: eventIdNum,
      });

      return ResponseHelper.fromQuery(
        reply,
        result,
        "Order event retrieved",
        "Event not found",
      );
    } catch (error) {
      return ResponseHelper.error(reply, error);
    }
  }
}
