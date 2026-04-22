import { IQuery, IQueryHandler } from "../../../../packages/core/src/application/cqrs";
import { ShipmentManagementService } from "../services/shipment-management.service";
import { OrderShipmentDTO } from "../../domain/entities/order-shipment.entity";
import { OrderShipmentNotFoundError } from "../../domain/errors/order-management.errors";

export interface GetShipmentQuery extends IQuery {
  readonly orderId: string;
  readonly shipmentId: string;
}

export class GetShipmentHandler implements IQueryHandler<GetShipmentQuery, OrderShipmentDTO> {
  constructor(private readonly shipmentService: ShipmentManagementService) {}

  async handle(query: GetShipmentQuery): Promise<OrderShipmentDTO> {
    const shipment = await this.shipmentService.getShipmentById(query.shipmentId);
    if (!shipment) throw new OrderShipmentNotFoundError(query.shipmentId);
    return shipment;
  }
}
