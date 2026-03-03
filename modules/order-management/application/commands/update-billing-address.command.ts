import { OrderManagementService } from "../services/order-management.service";
import { OrderAddress } from "../../domain/entities/order-address.entity";
import {
  ICommand,
  ICommandHandler,
  CommandResult,
} from "@/api/src/shared/application";

export interface UpdateBillingAddressCommand extends ICommand {
  orderId: string;
  billingAddress: {
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

export class UpdateBillingAddressCommandHandler implements ICommandHandler<
  UpdateBillingAddressCommand,
  CommandResult<OrderAddress>
> {
  constructor(private readonly orderService: OrderManagementService) {}

  async handle(
    command: UpdateBillingAddressCommand,
  ): Promise<CommandResult<OrderAddress>> {
    try {
      // Validate command
      if (!command.orderId || command.orderId.trim().length === 0) {
        return CommandResult.failure<OrderAddress>("Order ID is required");
      }

      if (!command.billingAddress) {
        return CommandResult.failure<OrderAddress>(
          "Billing address is required",
        );
      }

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
