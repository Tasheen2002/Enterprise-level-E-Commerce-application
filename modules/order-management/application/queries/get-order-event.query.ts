import { IQuery, IQueryHandler, QueryResult } from "../../../../packages/core/src/application/cqrs";
import { OrderEventService } from "../services/order-event.service";
import { OrderEvent, OrderEventDTO } from "../../domain/entities/order-event.entity";

export interface GetOrderEventQuery extends IQuery {
  readonly eventId: number;
}

export class GetOrderEventHandler implements IQueryHandler<GetOrderEventQuery, QueryResult<OrderEventDTO>> {
  constructor(private readonly orderEventService: OrderEventService) {}

  async handle(query: GetOrderEventQuery): Promise<QueryResult<OrderEventDTO>> {
    const event = await this.orderEventService.getEventById(query.eventId);
    return QueryResult.success(OrderEvent.toDTO(event));
  }
}
