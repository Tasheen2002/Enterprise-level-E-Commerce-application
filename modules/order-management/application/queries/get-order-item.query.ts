import {
  IQuery,
  IQueryHandler,
  QueryResult,
} from "@/api/src/shared/application";
import { OrderManagementService } from "../services/order-management.service";

export interface GetOrderItemQuery extends IQuery {
  itemId: string;
}

export interface OrderItemResult {
  orderItemId: string;
  orderId: string;
  variantId: string;
  quantity: number;
  productSnapshot: {
    productId: string;
    variantId: string;
    sku: string;
    name: string;
    variantName?: string;
    price: number;
    imageUrl?: string;
    weight?: number;
    dimensions?: {
      length: number;
      width: number;
      height: number;
    };
    attributes?: Record<string, any>;
  };
  isGift: boolean;
  giftMessage?: string;
  subtotal: number;
}

export class GetOrderItemHandler implements IQueryHandler<
  GetOrderItemQuery,
  QueryResult<OrderItemResult>
> {
  constructor(
    private readonly orderManagementService: OrderManagementService,
  ) {}

  async handle(
    query: GetOrderItemQuery,
  ): Promise<QueryResult<OrderItemResult>> {
    try {
      // Validate
      if (!query.itemId || query.itemId.trim().length === 0) {
        return QueryResult.failure<OrderItemResult>("itemId is required");
      }

      // Get order item
      const item = await this.orderManagementService.getOrderItem(query.itemId);

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
