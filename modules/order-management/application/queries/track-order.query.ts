import { IQuery, IQueryHandler } from "../../../../packages/core/src/application/cqrs";
import { OrderManagementService, TrackOrderResult } from "../services/order-management.service";

export interface TrackOrderQuery extends IQuery {
  readonly orderNumber?: string;
  readonly contact?: string;
  readonly trackingNumber?: string;
}

export type { TrackOrderResult };

export class TrackOrderHandler implements IQueryHandler<TrackOrderQuery, TrackOrderResult> {
  constructor(private readonly orderService: OrderManagementService) {}

  async handle(query: TrackOrderQuery): Promise<TrackOrderResult> {
    return this.orderService.trackOrder(query);
  }
}
