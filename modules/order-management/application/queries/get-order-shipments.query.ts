import {
  IQuery,
  IQueryHandler,
  QueryResult,
} from "@/api/src/shared/application";
import { OrderManagementService } from "../services/order-management.service";

export interface GetOrderShipmentsQuery extends IQuery {
  orderId: string;
}

export interface ShipmentResult {
  shipmentId: string;
  orderId: string;
  carrier?: string;
  service?: string;
  trackingNumber?: string;
  giftReceipt: boolean;
  pickupLocationId?: string;
  shippedAt?: Date;
  deliveredAt?: Date;
  isShipped: boolean;
  isDelivered: boolean;
}

export class GetOrderShipmentsHandler implements IQueryHandler<
  GetOrderShipmentsQuery,
  QueryResult<ShipmentResult[]>
> {
  constructor(
    private readonly orderManagementService: OrderManagementService,
  ) {}

  async handle(
    query: GetOrderShipmentsQuery,
  ): Promise<QueryResult<ShipmentResult[]>> {
    try {
      // Validate
      if (!query.orderId || query.orderId.trim().length === 0) {
        return QueryResult.failure<ShipmentResult[]>("orderId is required");
      }

      // Get shipments
      const shipments = await this.orderManagementService.getOrderShipments(
        query.orderId,
      );

      const results: ShipmentResult[] = shipments.map((shipment) => ({
        shipmentId: shipment.getShipmentId(),
        orderId: shipment.getOrderId(),
        carrier: shipment.getCarrier(),
        service: shipment.getService(),
        trackingNumber: shipment.getTrackingNumber(),
        giftReceipt: shipment.hasGiftReceipt(),
        pickupLocationId: shipment.getPickupLocationId(),
        shippedAt: shipment.getShippedAt(),
        deliveredAt: shipment.getDeliveredAt(),
        isShipped: shipment.isShipped(),
        isDelivered: shipment.isDelivered(),
      }));

      return QueryResult.success<ShipmentResult[]>(results);
    } catch (error) {
      if (error instanceof Error) {
        return QueryResult.failure<ShipmentResult[]>(
          `Failed to retrieve shipments: ${error.message}`,
        );
      }

      return QueryResult.failure<ShipmentResult[]>(
        "An unexpected error occurred while retrieving shipments",
      );
    }
  }
}
