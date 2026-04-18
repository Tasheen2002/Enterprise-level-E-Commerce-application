import { IQuery, IQueryHandler } from "../../../../packages/core/src/application/cqrs";
import { OrderManagementService } from "../services/order-management.service";
import { OrderAddressDTO } from "../../domain/entities/order-address.entity";
import { OrderAddressNotFoundError } from "../../domain/errors/order-management.errors";

export interface GetOrderAddressQuery extends IQuery {
  readonly orderId: string;
}

export class GetOrderAddressHandler implements IQueryHandler<GetOrderAddressQuery, OrderAddressDTO> {
  constructor(private readonly orderManagementService: OrderManagementService) {}

  async handle(query: GetOrderAddressQuery): Promise<OrderAddressDTO> {
    const orderAddress = await this.orderManagementService.getOrderAddress(query.orderId);
    if (!orderAddress) throw new OrderAddressNotFoundError(query.orderId);
    return orderAddress;
  }
}
