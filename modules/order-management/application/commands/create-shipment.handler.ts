import { ICommandHandler, CommandResult } from "@/api/src/shared/application";
import { CreateShipmentCommand } from "./create-shipment.command";
import { OrderManagementService } from "../services/order-management.service";
import { OrderShipment } from "../../domain/entities/order-shipment.entity";

export class CreateShipmentCommandHandler implements ICommandHandler<
  CreateShipmentCommand,
  CommandResult<OrderShipment>
> {
  constructor(private readonly orderService: OrderManagementService) {}

  async handle(
    command: CreateShipmentCommand,
  ): Promise<CommandResult<OrderShipment>> {
    try {
      const shipment = await this.orderService.createShipment({
        orderId: command.orderId,
        carrier: command.carrier,
        service: command.service,
        trackingNumber: command.trackingNumber,
        giftReceipt: command.giftReceipt,
        pickupLocationId: command.pickupLocationId,
      });

      return CommandResult.success(shipment);
    } catch (error) {
      return CommandResult.failure<OrderShipment>(
        error instanceof Error
          ? error.message
          : "An unexpected error occurred while creating shipment",
        [error instanceof Error ? error.message : "Unknown error"],
      );
    }
  }
}
