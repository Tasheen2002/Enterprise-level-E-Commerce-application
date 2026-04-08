import { ShipmentService } from "../services/shipment.service";
import { Shipment } from "../../domain/entities/shipment.entity";
import { CommandResult } from "../commands/create-shipment.command";

// Query interfaces
export interface IQuery {
  readonly queryId?: string;
  readonly timestamp?: Date;
}

export interface IQueryHandler<TQuery extends IQuery, TResult = any> {
  handle(query: TQuery): Promise<TResult>;
}

export interface GetShipmentQuery extends IQuery {
  shipmentId: string;
}

export interface ShipmentResult {
  shipmentId: string;
  orderId: string;
  carrier?: string;
  service?: string;
  labelUrl?: string;
  status: string;
  isGift: boolean;
  giftMessage?: string;
  items: Array<{
    orderItemId: string;
    qty: number;
  }>;
  shippedAt?: Date;
  deliveredAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class GetShipmentQueryHandler
  implements IQueryHandler<GetShipmentQuery, CommandResult<ShipmentResult>>
{
  constructor(private readonly shipmentService: ShipmentService) {}

  async handle(
    query: GetShipmentQuery
  ): Promise<CommandResult<ShipmentResult>> {
    try {
      const errors: string[] = [];

      // Validation
      if (!query.shipmentId?.trim()) {
        errors.push("Shipment ID is required");
      }

      if (errors.length > 0) {
        return CommandResult.failure("Validation failed", errors);
      }

      const shipment = await this.shipmentService.getShipment(query.shipmentId);

      if (!shipment) {
        return CommandResult.failure("Shipment not found");
      }

      const result: ShipmentResult = {
        shipmentId: shipment.getShipmentId().getValue(),
        orderId: shipment.getOrderId(),
        carrier: shipment.getCarrier(),
        service: shipment.getService(),
        labelUrl: shipment.getLabelUrl(),
        status: shipment.getStatus().toString(),
        isGift: shipment.isGiftOrder(),
        giftMessage: shipment.getGiftMessage(),
        items: shipment.getItems().map((item) => ({
          orderItemId: item.getOrderItemId(),
          qty: item.getQty(),
        })),
        shippedAt: shipment.getShippedAt(),
        deliveredAt: shipment.getDeliveredAt(),
        createdAt: shipment.getCreatedAt(),
        updatedAt: shipment.getUpdatedAt(),
      };

      return CommandResult.success(result);
    } catch (error) {
      return CommandResult.failure(
        error instanceof Error ? error.message : "Unknown error occurred"
      );
    }
  }
}
