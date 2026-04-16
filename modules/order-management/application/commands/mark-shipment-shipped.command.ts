import { ICommand, ICommandHandler, CommandResult } from "../../../../packages/core/src/application/cqrs";
import { OrderManagementService } from "../services/order-management.service";
import { OrderShipmentDTO } from "../../domain/entities/order-shipment.entity";

export interface MarkShipmentShippedCommand extends ICommand {
  readonly orderId: string;
  readonly shipmentId: string;
  readonly carrier: string;
  readonly service: string;
  readonly trackingNumber: string;
}

export class MarkShipmentShippedCommandHandler implements ICommandHandler<
  MarkShipmentShippedCommand,
  CommandResult<OrderShipmentDTO>
> {
  constructor(private readonly orderService: OrderManagementService) {}

  async handle(command: MarkShipmentShippedCommand): Promise<CommandResult<OrderShipmentDTO>> {
    const shipment = await this.orderService.markShipmentShipped({
      orderId: command.orderId,
      shipmentId: command.shipmentId,
      carrier: command.carrier,
      service: command.service,
      trackingNumber: command.trackingNumber,
    });
    return CommandResult.success(shipment);
  }
}
