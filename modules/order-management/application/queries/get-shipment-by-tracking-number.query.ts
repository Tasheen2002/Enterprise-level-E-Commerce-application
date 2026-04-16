import { IQuery, IQueryHandler, QueryResult } from "../../../../packages/core/src/application/cqrs";
import { ShipmentManagementService } from "../services/shipment-management.service";
import { OrderShipmentDTO } from "../../domain/entities/order-shipment.entity";
import { OrderShipmentNotFoundError } from "../../domain/errors/order-management.errors";

export interface GetShipmentByTrackingNumberQuery extends IQuery {
  readonly trackingNumber: string;
}

export class GetShipmentByTrackingNumberHandler
  implements IQueryHandler<GetShipmentByTrackingNumberQuery, QueryResult<OrderShipmentDTO>>
{
  constructor(private readonly shipmentService: ShipmentManagementService) {}

  async handle(query: GetShipmentByTrackingNumberQuery): Promise<QueryResult<OrderShipmentDTO>> {
    const dto = await this.shipmentService.getShipmentByTrackingNumber(query.trackingNumber);
    if (!dto) throw new OrderShipmentNotFoundError(query.trackingNumber);
    return QueryResult.success(dto);
  }
}
