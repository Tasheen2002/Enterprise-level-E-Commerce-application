import { IQuery, IQueryHandler } from "../../../../packages/core/src/application/cqrs";
import { ShipmentManagementService } from "../services/shipment-management.service";
import { OrderShipment, OrderShipmentDTO } from "../../domain/entities/order-shipment.entity";

export interface ListOrderShipmentsQuery extends IQuery {
  readonly orderId: string;
}

export class ListOrderShipmentsHandler implements IQueryHandler<ListOrderShipmentsQuery, OrderShipmentDTO[]> {
  constructor(private readonly shipmentService: ShipmentManagementService) {}

  async handle(query: ListOrderShipmentsQuery): Promise<OrderShipmentDTO[]> {
    const shipments = await this.shipmentService.getShipmentsByOrderId(query.orderId);
    return shipments.map(OrderShipment.toDTO);
  }
}
