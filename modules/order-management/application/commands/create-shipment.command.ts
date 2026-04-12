import { ICommand, ICommandHandler, CommandResult } from "../../../../packages/core/src/application/cqrs";
import { OrderManagementService } from "../services/order-management.service";
import { OrderShipment, OrderShipmentDTO } from "../../domain/entities/order-shipment.entity";

export interface CreateShipmentCommand extends ICommand {
  orderId: string;
  carrier?: string;
  service?: string;
  trackingNumber?: string;
  giftReceipt?: boolean;
  pickupLocationId?: string;
}


export class CreateShipmentCommandHandler implements ICommandHandler<
  CreateShipmentCommand,
  CommandResult<OrderShipmentDTO>
> {
  constructor(private orderService: OrderManagementService) {}

  async handle(
    command: CreateShipmentCommand,
  ): Promise<CommandResult<OrderShipmentDTO>> {
    const shipment = await this.orderService.createShipment({
        orderId: command.orderId,
        carrier: command.carrier,
        service: command.service,
        trackingNumber: command.trackingNumber,
        giftReceipt: command.giftReceipt,
        pickupLocationId: command.pickupLocationId,
      });

      return CommandResult.success(OrderShipment.toDTO(shipment));
  }
}
