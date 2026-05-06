import { IQuery, IQueryHandler } from "../../../../packages/core/src/application/cqrs";
import { OrderEventService } from "../services/order-event.service";
import { OrderEventDTO } from "../../domain/entities/order-event.entity";
import { OrderEventNotFoundError } from "../../domain/errors/order-management.errors";

export interface GetOrderEventQuery extends IQuery {
  readonly orderId: string;
  readonly eventId: number;
}

export class GetOrderEventHandler implements IQueryHandler<GetOrderEventQuery, OrderEventDTO> {
  constructor(private readonly orderEventService: OrderEventService) {}

  async handle(query: GetOrderEventQuery): Promise<OrderEventDTO> {
    const event = await this.orderEventService.getEventById(query.eventId);
    // Treat cross-order access as not-found rather than 403 — don't leak the
    // existence of events from other orders (event IDs are sequential/guessable).
    if (!event || event.orderId !== query.orderId) {
      throw new OrderEventNotFoundError(String(query.eventId));
    }
    return event;
  }
}
