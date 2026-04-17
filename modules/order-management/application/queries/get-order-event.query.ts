import { IQuery, IQueryHandler } from "../../../../packages/core/src/application/cqrs";
import { OrderEventService } from "../services/order-event.service";
import { OrderEvent, OrderEventDTO } from "../../domain/entities/order-event.entity";

export interface GetOrderEventQuery extends IQuery {
  readonly eventId: number;
}

export class GetOrderEventHandler implements IQueryHandler<GetOrderEventQuery, OrderEventDTO> {
  constructor(private readonly orderEventService: OrderEventService) {}

  async handle(query: GetOrderEventQuery): Promise<OrderEventDTO> {
    const event = await this.orderEventService.getEventById(query.eventId);
    return OrderEvent.toDTO(event);
  }
}
