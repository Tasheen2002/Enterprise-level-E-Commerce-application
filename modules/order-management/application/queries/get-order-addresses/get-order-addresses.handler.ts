import { IQueryHandler, QueryResult } from "@/api/src/shared/application";
import {
  GetOrderAddressesQuery,
  OrderAddressResult,
} from "./get-order-addresses.query";
import { OrderManagementService } from "../../services/order-management.service";

export class GetOrderAddressesHandler implements IQueryHandler<
  GetOrderAddressesQuery,
  QueryResult<OrderAddressResult>
> {
  constructor(
    private readonly orderManagementService: OrderManagementService,
  ) {}

  async handle(
    query: GetOrderAddressesQuery,
  ): Promise<QueryResult<OrderAddressResult>> {
    try {
      // Get order addresses (service throws if not found)
      const orderAddress = await this.orderManagementService.getOrderAddress(
        query.orderId,
      );

      const result: OrderAddressResult = {
        orderId: orderAddress.getOrderId(),
        billingAddress: orderAddress.getBillingAddress().toJSON(),
        shippingAddress: orderAddress.getShippingAddress().toJSON(),
        isSameAddress: orderAddress.isSameAddress(),
      };

      return QueryResult.success<OrderAddressResult>(result);
    } catch (error) {
      if (error instanceof Error) {
        return QueryResult.failure<OrderAddressResult>(
          `Failed to retrieve order addresses: ${error.message}`,
        );
      }

      return QueryResult.failure<OrderAddressResult>(
        "An unexpected error occurred while retrieving order addresses",
      );
    }
  }
}
