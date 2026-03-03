import { OrderManagementService } from "../services/order-management.service";
import { OrderAddress } from "../../domain/entities/order-address.entity";
import {
  ICommand,
  ICommandHandler,
  CommandResult,
} from "@/api/src/shared/application";

export interface UpdateShippingAddressCommand extends ICommand {
  orderId: string;
  shippingAddress: {
    firstName: string;
    lastName: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    phone?: string;
    email?: string;
  };
}

export class UpdateShippingAddressCommandHandler implements ICommandHandler<
  UpdateShippingAddressCommand,
  CommandResult<OrderAddress>
> {
  constructor(private readonly orderService: OrderManagementService) {}

  async handle(
    command: UpdateShippingAddressCommand,
  ): Promise<CommandResult<OrderAddress>> {
    try {
      // Validate command
      if (!command.orderId || command.orderId.trim().length === 0) {
        return CommandResult.failure<OrderAddress>("Order ID is required");
      }

      if (!command.shippingAddress) {
        return CommandResult.failure<OrderAddress>(
          "Shipping address is required",
        );
      }

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
