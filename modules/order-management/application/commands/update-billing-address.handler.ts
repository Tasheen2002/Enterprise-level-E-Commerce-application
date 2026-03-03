import { ICommandHandler, CommandResult } from "@/api/src/shared/application";
import { UpdateBillingAddressCommand } from "./update-billing-address.command";
import { OrderManagementService } from "../services/order-management.service";
import { OrderAddress } from "../../domain/entities/order-address.entity";

export class UpdateBillingAddressCommandHandler implements ICommandHandler<
  UpdateBillingAddressCommand,
  CommandResult<OrderAddress>
> {
  constructor(private readonly orderService: OrderManagementService) {}

  async handle(
    command: UpdateBillingAddressCommand,
  ): Promise<CommandResult<OrderAddress>> {
    try {
      const orderAddress = await this.orderService.updateBillingAddress(
        command.orderId,
        command.billingAddress,
      );

      return CommandResult.success<OrderAddress>(orderAddress);
    } catch (error) {
      if (error instanceof Error) {
        return CommandResult.failure<OrderAddress>(error.message);
      }

      return CommandResult.failure<OrderAddress>(
        "An unexpected error occurred while updating billing address",
      );
    }
  }
}
