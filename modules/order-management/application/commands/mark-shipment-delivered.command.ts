import { ICommand, ICommandHandler, CommandResult } from "../../../../packages/core/src/application/cqrs";
import { OrderManagementService } from "../services/order-management.service";
import { OrderShipmentDTO } from "../../domain/entities/order-shipment.entity";

export interface MarkShipmentDeliveredCommand extends ICommand {
  readonly orderId: string;
  readonly shipmentId: string;
  readonly deliveredAt?: Date;
}

export class MarkShipmentDeliveredHandler implements ICommandHandler<
  MarkShipmentDeliveredCommand,
  CommandResult<OrderShipmentDTO>
> {
  constructor(private readonly orderService: OrderManagementService) {}

  async handle(command: MarkShipmentDeliveredCommand): Promise<CommandResult<OrderShipmentDTO>> {
    const shipment = await this.orderService.markShipmentDelivered({
      orderId: command.orderId,
      shipmentId: command.shipmentId,
      deliveredAt: command.deliveredAt,
    });
    return CommandResult.success(shipment);
  }
}
