import { IQuery, IQueryHandler, QueryResult } from "../../../../packages/core/src/application/cqrs";
import { OrderManagementService } from "../services/order-management.service";
import { OrderAddress, OrderAddressDTO } from "../../domain/entities/order-address.entity";

export interface GetOrderAddressQuery extends IQuery {
  readonly orderId: string;
}

export class GetOrderAddressHandler implements IQueryHandler<GetOrderAddressQuery, QueryResult<OrderAddressDTO>> {
  constructor(private readonly orderManagementService: OrderManagementService) {}

  async handle(query: GetOrderAddressQuery): Promise<QueryResult<OrderAddressDTO>> {
    const orderAddress = await this.orderManagementService.getOrderAddress(query.orderId);
    return QueryResult.success(OrderAddress.toDTO(orderAddress));
  }
}
