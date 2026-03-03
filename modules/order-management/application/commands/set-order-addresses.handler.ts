import { ICommandHandler, CommandResult } from "@/api/src/shared/application";
import { SetOrderAddressesCommand } from "./set-order-addresses.command";
import { OrderManagementService } from "../services/order-management.service";
import { OrderAddress } from "../../domain/entities/order-address.entity";

export class SetOrderAddressesCommandHandler implements ICommandHandler<
  SetOrderAddressesCommand,
  CommandResult<OrderAddress>
> {
  constructor(private readonly orderService: OrderManagementService) {}

  async handle(
    command: SetOrderAddressesCommand,
  ): Promise<CommandResult<OrderAddress>> {
    try {
      const orderAddress = await this.orderService.setOrderAddress(
        command.orderId,
        command.billingAddress,
        command.shippingAddress,
      );

      return CommandResult.success<OrderAddress>(orderAddress);
    } catch (error) {
      if (error instanceof Error) {
        return CommandResult.failure<OrderAddress>(error.message);
      }

      return CommandResult.failure<OrderAddress>(
        "An unexpected error occurred while setting order addresses",
      );
    }
  }
}
