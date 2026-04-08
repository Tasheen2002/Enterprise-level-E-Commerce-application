import { IQueryHandler, QueryResult } from "@/api/src/shared/application";
import { GetOrderEventQuery, OrderEventResult } from "./get-order-event.query";
import { OrderEventService } from "../../services/order-event.service";

export class GetOrderEventHandler implements IQueryHandler<
  GetOrderEventQuery,
  QueryResult<OrderEventResult | null>
> {
  constructor(private readonly orderEventService: OrderEventService) {}

  async handle(
    query: GetOrderEventQuery,
  ): Promise<QueryResult<OrderEventResult | null>> {
    try {
      // Get event (service throws if not found)
      const event = await this.orderEventService.getEventById(query.eventId);

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
