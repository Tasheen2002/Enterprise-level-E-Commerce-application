import { ICommand, ICommandHandler, CommandResult } from "../../../../packages/core/src/application/cqrs";
import { OrderManagementService } from "../services/order-management.service";
import { OrderShipment, OrderShipmentDTO } from "../../domain/entities/order-shipment.entity";

export interface UpdateShipmentTrackingCommand extends ICommand {
  orderId: string;
  shipmentId: string;
  trackingNumber: string;
  carrier?: string;
  service?: string;
}


export class UpdateShipmentTrackingCommandHandler implements ICommandHandler<
  UpdateShipmentTrackingCommand,
  CommandResult<OrderShipmentDTO>
> {
  constructor(private orderService: OrderManagementService) {}

  async handle(
    command: UpdateShipmentTrackingCommand,
  ): Promise<CommandResult<OrderShipmentDTO>> {
    const shipment = await this.orderService.updateShipmentTracking({
        orderId: command.orderId,
        shipmentId: command.shipmentId,
        trackingNumber: command.trackingNumber,
        carrier: command.carrier,
        service: command.service,
      });

      return CommandResult.success(OrderShipment.toDTO(shipment));
  }
}
