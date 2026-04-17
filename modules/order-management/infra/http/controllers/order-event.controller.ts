import { FastifyReply } from "fastify";
import { AuthenticatedRequest } from "@/api/src/shared/interfaces/authenticated-request.interface";
import { ResponseHelper } from "@/api/src/shared/response.helper";
import {
  LogOrderEventCommand,
  LogOrderEventCommandHandler,
  ListOrderEventsQuery,
  ListOrderEventsHandler,
  GetOrderEventQuery,
  GetOrderEventHandler,
} from "../../../application";

export interface LogEventRequest {
  Params: { orderId: string };
  Body: {
    eventType: string;
    payload?: Record<string, unknown>;
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
    eventId: number;
  };
}

export class OrderEventController {
  constructor(
    private readonly logEventHandler: LogOrderEventCommandHandler,
    private readonly listOrderEventsHandler: ListOrderEventsHandler,
    private readonly getOrderEventHandler: GetOrderEventHandler,
  ) {}

  async logEvent(
    request: AuthenticatedRequest<LogEventRequest>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const command: LogOrderEventCommand = {
        orderId: request.params.orderId,
        eventType: request.body.eventType,
        payload: request.body.payload,
      };
      const result = await this.logEventHandler.handle(command);
      return ResponseHelper.fromCommand(reply, result, "Event logged successfully", 201);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async getEvents(
    request: AuthenticatedRequest<GetEventsRequest>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const query: ListOrderEventsQuery = {
        orderId: request.params.orderId,
        eventType: request.query.eventType,
        limit: request.query.limit,
        offset: request.query.offset,
        sortBy: request.query.sortBy,
        sortOrder: request.query.sortOrder,
      };
      const result = await this.listOrderEventsHandler.handle(query);
      return ResponseHelper.ok(reply, "Order events retrieved successfully", result);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async getEvent(
    request: AuthenticatedRequest<GetEventRequest>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const query: GetOrderEventQuery = { eventId: request.params.eventId };
      const result = await this.getOrderEventHandler.handle(query);
      return ResponseHelper.ok(reply, "Order event retrieved successfully", result);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }
}
