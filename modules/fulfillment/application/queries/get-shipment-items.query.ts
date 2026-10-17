import {
  type IQuery,
  type IQueryHandler,
  CommandResult,
} from "../../../../packages/core/src/application/cqrs";
import { ShipmentItemService } from "../services/shipment-item.service";

// Query interfaces

export interface GetShipmentItemsQuery extends IQuery {
  shipmentId: string;
}

export interface ShipmentItemResult {
  shipmentId: string;
  orderItemId: string;
  qty: number;
  giftWrap: boolean;
  giftMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface GetShipmentItemsResult {
  items: ShipmentItemResult[];
  totalQuantity: number;
}

export class GetShipmentItemsQueryHandler
  implements IQueryHandler<GetShipmentItemsQuery, CommandResult<GetShipmentItemsResult>>
{
  constructor(private readonly shipmentItemService: ShipmentItemService) {}

  async handle(query: GetShipmentItemsQuery): Promise<CommandResult<GetShipmentItemsResult>> {
    try {
      const errors: string[] = [];

      // Validation
      if (!query.shipmentId?.trim()) {
        errors.push("Shipment ID is required");
      }

      if (errors.length > 0) {
        return CommandResult.failure("Validation failed", errors);
      }

      const items = await this.shipmentItemService.getShipmentItems(query.shipmentId);

      const result: GetShipmentItemsResult = {
        items: items.map((item) => ({
          shipmentId: item.getShipmentId(),
          orderItemId: item.getOrderItemId(),
          qty: item.getQty(),
          giftWrap: item.isGiftWrapped(),
          giftMessage: item.getGiftMessage(),
          createdAt: item.getCreatedAt(),
          updatedAt: item.getUpdatedAt(),
        })),
        totalQuantity: items.reduce((total, item) => total + item.getQty(), 0),
      };

      return CommandResult.success(result);
    } catch (error) {
      return CommandResult.failure(
        error instanceof Error ? error.message : "Unknown error occurred",
      );
    }
  }
}
