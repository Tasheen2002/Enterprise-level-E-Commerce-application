import { ICommand, ICommandHandler, CommandResult } from "../../../../packages/core/src/application/cqrs";
import { OrderManagementService } from "../services/order-management.service";
import { OrderShipmentDTO } from "../../domain/entities/order-shipment.entity";

export interface UpdateShipmentTrackingCommand extends ICommand {
  readonly orderId: string;
  readonly shipmentId: string;
  readonly trackingNumber: string;
  readonly carrier?: string;
  readonly service?: string;
}

export class UpdateShipmentTrackingCommandHandler implements ICommandHandler<
  UpdateShipmentTrackingCommand,
  CommandResult<OrderShipmentDTO>
> {
  constructor(private readonly orderService: OrderManagementService) {}

  async handle(command: UpdateShipmentTrackingCommand): Promise<CommandResult<OrderShipmentDTO>> {
    const shipment = await this.orderService.updateShipmentTracking({
      orderId: command.orderId,
      shipmentId: command.shipmentId,
      trackingNumber: command.trackingNumber,
      carrier: command.carrier,
      service: command.service,
    });
    return CommandResult.success(shipment);
  }
}
