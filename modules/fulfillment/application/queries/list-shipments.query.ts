import { ShipmentService } from "../services/shipment.service";
import { CommandResult } from "../commands/create-shipment.command";
import { ShipmentResult } from "./get-shipment.query";
import { ShipmentStatus } from "../../domain/value-objects";

// Query interfaces
export interface IQuery {
  readonly queryId?: string;
  readonly timestamp?: Date;
}

export interface IQueryHandler<TQuery extends IQuery, TResult = any> {
  handle(query: TQuery): Promise<TResult>;
}

export interface ListShipmentsQuery extends IQuery {
  orderId?: string;
  status?: string;
  carrier?: string;
  limit?: number;
  offset?: number;
  sortBy?: "createdAt" | "updatedAt" | "shippedAt" | "deliveredAt";
  sortOrder?: "asc" | "desc";
}

export interface ListShipmentsResult {
  shipments: ShipmentResult[];
  total: number;
  limit: number;
  offset: number;
}

export class ListShipmentsQueryHandler
  implements
    IQueryHandler<ListShipmentsQuery, CommandResult<ListShipmentsResult>>
{
  constructor(private readonly shipmentService: ShipmentService) {}

  async handle(
    query: ListShipmentsQuery
  ): Promise<CommandResult<ListShipmentsResult>> {
    try {
      const filters = {
        orderId: query.orderId,
        status: query.status ? ShipmentStatus.create(query.status) : undefined,
        carrier: query.carrier,
      };

      const options = {
        limit: query.limit || 50,
        offset: query.offset || 0,
        sortBy: query.sortBy || ("createdAt" as const),
        sortOrder: query.sortOrder || ("desc" as const),
      };

      const { shipments, total } = await this.shipmentService.listShipments(
        filters,
        options
      );

      const result: ListShipmentsResult = {
        shipments: shipments.map((shipment) => ({
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
        })),
        total,
        limit: options.limit,
        offset: options.offset,
      };

      return CommandResult.success(result);
    } catch (error) {
      return CommandResult.failure(
        error instanceof Error ? error.message : "Unknown error occurred"
      );
    }
  }
}
