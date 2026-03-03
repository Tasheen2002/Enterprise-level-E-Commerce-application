import { IQueryHandler, QueryResult } from "@/api/src/shared/application";
import { GetShipmentQuery, ShipmentResult } from "./get-shipment.query";
import { OrderManagementService } from "../services/order-management.service";

export class GetShipmentHandler implements IQueryHandler<
  GetShipmentQuery,
  QueryResult<ShipmentResult>
> {
  constructor(
    private readonly orderManagementService: OrderManagementService,
  ) {}

  async handle(query: GetShipmentQuery): Promise<QueryResult<ShipmentResult>> {
    try {
      // Get shipment
      const shipment = await this.orderManagementService.getShipment(
        query.orderId,
        query.shipmentId,
      );

      if (!shipment) {
        return QueryResult.failure<ShipmentResult>("Shipment not found");
      }

      const result: ShipmentResult = {
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
      };

      return QueryResult.success<ShipmentResult>(result);
    } catch (error) {
      if (error instanceof Error) {
        return QueryResult.failure<ShipmentResult>(
          `Failed to retrieve shipment: ${error.message}`,
        );
      }

      return QueryResult.failure<ShipmentResult>(
        "An unexpected error occurred while retrieving shipment",
      );
    }
  }
}
