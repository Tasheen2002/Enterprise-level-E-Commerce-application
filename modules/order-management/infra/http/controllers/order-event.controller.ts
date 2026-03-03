import { FastifyRequest, FastifyReply } from "fastify";
import {
  LogOrderEventCommandHandler,
  GetOrderEventsHandler,
  GetOrderEventHandler,
  OrderEventService,
} from "../../../application";

interface LogEventRequest {
  Params: { orderId: string };
  Body: {
    eventType: string;
    payload?: Record<string, any>;
  };
}

interface GetEventsRequest {
  Params: { orderId: string };
  Querystring: {
    eventType?: string;
    limit?: number;
    offset?: number;
    sortBy?: "createdAt" | "eventId";
    sortOrder?: "asc" | "desc";
  };
}

interface GetEventRequest {
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

      if (result.success) {
        return reply.code(201).send({
          success: true,
          data: result.data,
          message: "Event logged successfully",
        });
      } else {
        return reply.code(400).send({
          success: false,
          error: result.error,
          errors: result.errors,
        });
      }
    } catch (error) {
      request.log.error(error, "Failed to log order event");
      return reply.code(500).send({
        success: false,
        error: "Internal server error",
      });
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
      request.log.error(error, "Failed to get order events");
      return reply.code(500).send({
        success: false,
        error: "Internal server error",
      });
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
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: "Invalid event ID",
        });
      }

      const result = await this.getOrderEventHandler.handle({
        eventId: eventIdNum,
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
      request.log.error(error, "Failed to get order event");
      return reply.code(500).send({
        success: false,
        error: "Internal server error",
      });
    }
  }
}
