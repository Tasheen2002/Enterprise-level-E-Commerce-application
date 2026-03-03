import { IQueryHandler, QueryResult } from "@/api/src/shared/application";
import { GetOrderItemsQuery, OrderItemResult } from "./get-order-items.query";
import { OrderManagementService } from "../services/order-management.service";

export class GetOrderItemsHandler implements IQueryHandler<
  GetOrderItemsQuery,
  QueryResult<OrderItemResult[]>
> {
  constructor(
    private readonly orderManagementService: OrderManagementService,
  ) {}

  async handle(
    query: GetOrderItemsQuery,
  ): Promise<QueryResult<OrderItemResult[]>> {
    try {
      // Get order items
      const items = await this.orderManagementService.getOrderItems(
        query.orderId,
      );

      const results: OrderItemResult[] = items.map((item) => ({
        orderItemId: item.getOrderItemId(),
        orderId: item.getOrderId(),
        variantId: item.getVariantId(),
        quantity: item.getQuantity(),
        productSnapshot: item.getProductSnapshot().toJSON(),
        isGift: item.isGiftItem(),
        giftMessage: item.getGiftMessage(),
        subtotal: item.calculateSubtotal(),
      }));

      return QueryResult.success<OrderItemResult[]>(results);
    } catch (error) {
      if (error instanceof Error) {
        return QueryResult.failure<OrderItemResult[]>(
          `Failed to retrieve order items: ${error.message}`,
        );
      }

      return QueryResult.failure<OrderItemResult[]>(
        "An unexpected error occurred while retrieving order items",
      );
    }
  }
}
