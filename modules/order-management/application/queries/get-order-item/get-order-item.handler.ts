import { IQueryHandler, QueryResult } from "@/api/src/shared/application";
import { GetOrderItemQuery, OrderItemResult } from "./get-order-item.query";
import { OrderItemManagementService } from "../../services/order-item-management.service";

export class GetOrderItemHandler implements IQueryHandler<
  GetOrderItemQuery,
  QueryResult<OrderItemResult>
> {
  constructor(private readonly orderItemService: OrderItemManagementService) {}

  async handle(
    query: GetOrderItemQuery,
  ): Promise<QueryResult<OrderItemResult>> {
    try {
      // Get order item
      const item = await this.orderItemService.getOrderItemById(query.itemId);

      if (!item) {
        return QueryResult.failure<OrderItemResult>("Order item not found");
      }

      const result: OrderItemResult = {
        orderItemId: item.getOrderItemId(),
        orderId: item.getOrderId(),
        variantId: item.getVariantId(),
        quantity: item.getQuantity(),
        productSnapshot: item.getProductSnapshot().toJSON(),
        isGift: item.isGiftItem(),
        giftMessage: item.getGiftMessage(),
        subtotal: item.calculateSubtotal(),
      };

      return QueryResult.success<OrderItemResult>(result);
    } catch (error) {
      if (error instanceof Error) {
        return QueryResult.failure<OrderItemResult>(
          `Failed to retrieve order item: ${error.message}`,
        );
      }

      return QueryResult.failure<OrderItemResult>(
        "An unexpected error occurred while retrieving order item",
      );
    }
  }
}
