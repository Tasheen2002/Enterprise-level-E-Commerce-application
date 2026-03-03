import { OrderManagementService } from "../services/order-management.service";
import { OrderAddress } from "../../domain/entities/order-address.entity";
import {
  ICommand,
  ICommandHandler,
  CommandResult,
} from "@/api/src/shared/application";

export interface SetOrderAddressesCommand extends ICommand {
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

export class SetOrderAddressesCommandHandler implements ICommandHandler<
  SetOrderAddressesCommand,
  CommandResult<OrderAddress>
> {
  constructor(private readonly orderService: OrderManagementService) {}

  async handle(
    command: SetOrderAddressesCommand,
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

      if (!command.shippingAddress) {
        return CommandResult.failure<OrderAddress>(
          "Shipping address is required",
        );
      }

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
