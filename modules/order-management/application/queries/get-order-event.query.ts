import {
  IQuery,
  IQueryHandler,
  QueryResult,
} from "@/api/src/shared/application";
import { OrderEventService } from "../services/order-event.service";

export interface OrderEventResult {
  eventId: number;
  orderId: string;
  eventType: string;
  payload: Record<string, any>;
  createdAt: Date;
}

export interface GetOrderEventQuery extends IQuery {
  eventId: number;
}

export class GetOrderEventHandler implements IQueryHandler<
  GetOrderEventQuery,
  QueryResult<OrderEventResult | null>
> {
  constructor(private readonly orderEventService: OrderEventService) {}

  async handle(
    query: GetOrderEventQuery,
  ): Promise<QueryResult<OrderEventResult | null>> {
    try {
      if (
        query.eventId === undefined ||
        query.eventId === null ||
        query.eventId < 0
      ) {
        return QueryResult.failure("Valid event ID is required");
      }

      const event = await this.orderEventService.getEventById(query.eventId);

      if (!event) {
        return QueryResult.failure("Event not found");
      }

      // Convert entity to plain object
      const result: OrderEventResult = {
        eventId: event.getEventId(),
        orderId: event.getOrderId(),
        eventType: event.getEventType(),
        payload: event.getPayload(),
        createdAt: event.getCreatedAt(),
      };

      return QueryResult.success(result);
    } catch (error) {
      return QueryResult.failure(
        error instanceof Error ? error.message : "Unknown error occurred",
      );
    }
  }
}
