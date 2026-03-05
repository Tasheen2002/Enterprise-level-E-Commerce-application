import { IQueryHandler, QueryResult } from "@/api/src/shared/application";
import {
  GetOrderShipmentsQuery,
  ShipmentResult,
} from "./get-order-shipments.query";
import { ShipmentManagementService } from "../services/shipment-management.service";

export class GetOrderShipmentsHandler implements IQueryHandler<
  GetOrderShipmentsQuery,
  QueryResult<ShipmentResult[]>
> {
  constructor(private readonly shipmentService: ShipmentManagementService) {}

  async handle(
    query: GetOrderShipmentsQuery,
  ): Promise<QueryResult<ShipmentResult[]>> {
    try {
      // Get shipments
      const shipments = await this.shipmentService.getShipmentsByOrderId(
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
