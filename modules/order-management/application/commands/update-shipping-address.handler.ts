import { ICommandHandler, CommandResult } from "@/api/src/shared/application";
import { UpdateShippingAddressCommand } from "./update-shipping-address.command";
import { OrderManagementService } from "../services/order-management.service";
import { OrderAddress } from "../../domain/entities/order-address.entity";

export class UpdateShippingAddressCommandHandler implements ICommandHandler<
  UpdateShippingAddressCommand,
  CommandResult<OrderAddress>
> {
  constructor(private readonly orderService: OrderManagementService) {}

  async handle(
    command: UpdateShippingAddressCommand,
  ): Promise<CommandResult<OrderAddress>> {
    try {
      const orderAddress = await this.orderService.updateShippingAddress(
        command.orderId,
        command.shippingAddress,
      );

      return CommandResult.success<OrderAddress>(orderAddress);
    } catch (error) {
      if (error instanceof Error) {
        return CommandResult.failure<OrderAddress>(error.message);
      }

      return CommandResult.failure<OrderAddress>(
        "An unexpected error occurred while updating shipping address",
      );
    }
  }
}
