import { IQuery, IQueryHandler } from "../../../../packages/core/src/application/cqrs";
import { OrderManagementService } from "../services/order-management.service";
import { OrderDTO } from "../../domain/entities/order.entity";
import {
  OrderNotFoundError,
  DomainValidationError,
} from "../../domain/errors/order-management.errors";

// Either/or query — caller must supply exactly one of orderId or orderNumber.
export interface GetOrderQuery extends IQuery {
  readonly orderId?: string;
  readonly orderNumber?: string;
  readonly requestingUserId: string;
  readonly isStaff: boolean;
}

export class GetOrderHandler implements IQueryHandler<GetOrderQuery, OrderDTO> {
  constructor(private readonly orderManagementService: OrderManagementService) {}

  async handle(query: GetOrderQuery): Promise<OrderDTO> {
    if (!query.orderId && !query.orderNumber) {
      throw new DomainValidationError(
        "Either orderId or orderNumber is required",
      );
    }

    const order = query.orderId
      ? await this.orderManagementService.getOrderById(
          query.orderId,
          query.requestingUserId,
          query.isStaff,
        )
      : await this.orderManagementService.getOrderByNumber(
          query.orderNumber!,
          query.requestingUserId,
          query.isStaff,
        );

    if (!order) {
      throw new OrderNotFoundError(query.orderId ?? query.orderNumber ?? "");
    }
    return order;
  }
}
