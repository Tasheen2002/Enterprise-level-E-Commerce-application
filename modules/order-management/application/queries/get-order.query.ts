import {
  IQuery,
  IQueryHandler,
  QueryResult,
} from "@/api/src/shared/application";
import { OrderManagementService } from "../services/order-management.service";
import { Order } from "../../domain/entities/order.entity";

export interface GetOrderQuery extends IQuery {
  orderId?: string;
  orderNumber?: string;
}

export interface OrderResult {
  orderId: string;
  orderNumber: string;
  userId?: string;
  guestToken?: string;
  items: Array<{
    orderItemId: string;
    variantId: string;
    quantity: number;
    subtotal: number;
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
  }>;
  totals: {
    subtotal: number;
    tax: number;
    shipping: number;
    discount: number;
    total: number;
  };
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
  } | null;
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
  } | null;
  shipments: Array<{
    shipmentId: string;
    carrier: string;
    service: string;
    trackingNumber?: string;
    shippedAt?: Date;
    deliveredAt?: Date;
  }>;
  status: string;
  source: string;
  currency: string;
  createdAt: Date;
  updatedAt: Date;
}

export class GetOrderHandler implements IQueryHandler<
  GetOrderQuery,
  QueryResult<OrderResult>
> {
  constructor(
    private readonly orderManagementService: OrderManagementService,
  ) {}

  async handle(query: GetOrderQuery): Promise<QueryResult<OrderResult>> {
    try {
      // Validate that either orderId or orderNumber is provided
      if (!query.orderId && !query.orderNumber) {
        return QueryResult.failure<OrderResult>(
          "Either orderId or orderNumber is required",
        );
      }

      // Get order by ID or order number
      let order: Order | null;
      if (query.orderId) {
        order = await this.orderManagementService.getOrderById(query.orderId);
      } else if (query.orderNumber) {
        order = await this.orderManagementService.getOrderByOrderNumber(
          query.orderNumber,
        );
      } else {
        order = null;
      }

      if (!order) {
        return QueryResult.failure<OrderResult>("Order not found");
      }

      // Get address and shipments explicitly since they might be loaded differently
      const address = await this.orderManagementService.getOrderAddress(
        order.getOrderId().getValue(),
      );
      const shipments = order.getShipments();

      const result: OrderResult = {
        orderId: order.getOrderId().toString(),
        orderNumber: order.getOrderNumber().toString(),
        userId: order.getUserId(),
        guestToken: order.getGuestToken(),
        items: order.getItems().map((item) => ({
          orderItemId: item.getOrderItemId(),
          variantId: item.getVariantId(),
          quantity: item.getQuantity(),
          subtotal: item.calculateSubtotal(),
          productSnapshot: item.getProductSnapshot().toJSON(),
          isGift: item.isGiftItem(),
          giftMessage: item.getGiftMessage(),
        })),
        totals: order.getTotals().toJSON(),
        billingAddress: address?.getBillingAddress()?.toJSON() || null,
        shippingAddress: address?.getShippingAddress()?.toJSON() || null,
        shipments: shipments.map((s) => ({
          shipmentId: s.getShipmentId(),
          carrier: s.getCarrier() || "Unknown",
          service: s.getService() || "Standard",
          trackingNumber: s.getTrackingNumber(),
          shippedAt: s.getShippedAt(),
          deliveredAt: s.getDeliveredAt(),
        })),
        status: order.getStatus().toString(),
        source: order.getSource().toString(),
        currency: order.getCurrency().toString(),
        createdAt: order.getCreatedAt(),
        updatedAt: order.getUpdatedAt(),
      };

      return QueryResult.success<OrderResult>(result);
    } catch (error) {
      if (error instanceof Error) {
        return QueryResult.failure<OrderResult>(
          `Failed to retrieve order: ${error.message}`,
        );
      }

      return QueryResult.failure<OrderResult>(
        "An unexpected error occurred while retrieving order",
      );
    }
  }
}
