import { ICommand, ICommandHandler, CommandResult } from "../../../../packages/core/src/application/cqrs";
import { OrderManagementService } from "../services/order-management.service";
import { OrderShipment, OrderShipmentDTO } from "../../domain/entities/order-shipment.entity";

export interface MarkShipmentShippedCommand extends ICommand {
  orderId: string;
  shipmentId: string;
  carrier: string;
  service: string;
  trackingNumber: string;
}


export class MarkShipmentShippedCommandHandler implements ICommandHandler<
  MarkShipmentShippedCommand,
  CommandResult<OrderShipmentDTO>
> {
  constructor(private orderService: OrderManagementService) {}

  async handle(
    command: MarkShipmentShippedCommand,
  ): Promise<CommandResult<OrderShipmentDTO>> {
    const shipment = await this.orderService.markShipmentShipped({
        orderId: command.orderId,
        shipmentId: command.shipmentId,
        carrier: command.carrier,
        service: command.service,
        trackingNumber: command.trackingNumber,
      });

      return CommandResult.success(OrderShipment.toDTO(shipment));
  }
}
