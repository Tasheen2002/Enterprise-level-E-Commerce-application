import { ICommand, ICommandHandler, CommandResult } from "../../../../packages/core/src/application/cqrs";
import { OrderManagementService } from "../services/order-management.service";
import { OrderShipmentDTO } from "../../domain/entities/order-shipment.entity";

export interface CreateShipmentCommand extends ICommand {
  readonly orderId: string;
  readonly carrier?: string;
  readonly service?: string;
  readonly trackingNumber?: string;
  readonly giftReceipt?: boolean;
  readonly pickupLocationId?: string;
}

export class CreateShipmentHandler implements ICommandHandler<
  CreateShipmentCommand,
  CommandResult<OrderShipmentDTO>
> {
  constructor(private readonly orderService: OrderManagementService) {}

  async handle(command: CreateShipmentCommand): Promise<CommandResult<OrderShipmentDTO>> {
    const shipment = await this.orderService.createShipment({
      orderId: command.orderId,
      carrier: command.carrier,
      service: command.service,
      trackingNumber: command.trackingNumber,
      giftReceipt: command.giftReceipt,
      pickupLocationId: command.pickupLocationId,
    });
    return CommandResult.success(shipment);
  }
}
