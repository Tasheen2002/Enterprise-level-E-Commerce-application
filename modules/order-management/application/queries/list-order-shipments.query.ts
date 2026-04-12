import { IQuery, IQueryHandler, QueryResult } from "../../../../packages/core/src/application/cqrs";
import { ShipmentManagementService } from "../services/shipment-management.service";
import { OrderShipment, OrderShipmentDTO } from "../../domain/entities/order-shipment.entity";

export interface ListOrderShipmentsQuery extends IQuery {
  readonly orderId: string;
}

export class ListOrderShipmentsHandler implements IQueryHandler<ListOrderShipmentsQuery, QueryResult<OrderShipmentDTO[]>> {
  constructor(private readonly shipmentService: ShipmentManagementService) {}

  async handle(query: ListOrderShipmentsQuery): Promise<QueryResult<OrderShipmentDTO[]>> {
    const shipments = await this.shipmentService.getShipmentsByOrderId(query.orderId);
    return QueryResult.success(shipments.map(OrderShipment.toDTO));
  }
}
