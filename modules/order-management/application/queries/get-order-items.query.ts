import {
  IQuery,
  IQueryHandler,
  QueryResult,
} from "@/api/src/shared/application";
import { OrderManagementService } from "../services/order-management.service";

export interface GetOrderItemsQuery extends IQuery {
  orderId: string;
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
      // Validate
      if (!query.orderId || query.orderId.trim().length === 0) {
        return QueryResult.failure<OrderItemResult[]>("orderId is required");
      }

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
