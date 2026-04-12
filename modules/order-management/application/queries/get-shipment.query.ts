import { IQuery, IQueryHandler, QueryResult } from "../../../../packages/core/src/application/cqrs";
import { ShipmentManagementService } from "../services/shipment-management.service";
import { OrderShipment, OrderShipmentDTO } from "../../domain/entities/order-shipment.entity";

export interface GetShipmentQuery extends IQuery {
  readonly orderId: string;
  readonly shipmentId: string;
}

export class GetShipmentHandler implements IQueryHandler<GetShipmentQuery, QueryResult<OrderShipmentDTO>> {
  constructor(private readonly shipmentService: ShipmentManagementService) {}

  async handle(query: GetShipmentQuery): Promise<QueryResult<OrderShipmentDTO>> {
    const shipment = await this.shipmentService.getShipmentById(query.shipmentId);
    return QueryResult.success(OrderShipment.toDTO(shipment));
  }
}
