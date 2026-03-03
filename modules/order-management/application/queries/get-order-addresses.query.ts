import {
  IQuery,
  IQueryHandler,
  QueryResult,
} from "@/api/src/shared/application";
import { OrderManagementService } from "../services/order-management.service";

export interface GetOrderAddressesQuery extends IQuery {
  orderId: string;
}

export interface OrderAddressResult {
  orderId: string;
  billingAddress: {
    firstName: string;
    lastName: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    phone?: string;
    email?: string;
  };
  shippingAddress: {
    firstName: string;
    lastName: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    phone?: string;
    email?: string;
  };
  isSameAddress: boolean;
}

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
      // Validate query
      if (!query.orderId || query.orderId.trim().length === 0) {
        return QueryResult.failure<OrderAddressResult>(
          "Order ID is required",
        );
      }

      // Get order addresses
      const orderAddress = await this.orderManagementService.getOrderAddress(
        query.orderId,
      );

      if (!orderAddress) {
        return QueryResult.failure<OrderAddressResult>(
          "Order addresses not found",
        );
      }

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
