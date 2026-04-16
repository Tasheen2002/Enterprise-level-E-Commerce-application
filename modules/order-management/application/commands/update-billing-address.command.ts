import {
  ICommand,
  ICommandHandler,
  CommandResult,
} from "../../../../packages/core/src/application/cqrs";
import { OrderManagementService } from "../services/order-management.service";
import { OrderAddressDTO } from "../../domain/entities/order-address.entity";

export interface UpdateBillingAddressCommand extends ICommand {
  readonly orderId: string;
  readonly billingAddress: {
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
  CommandResult<OrderAddressDTO>
> {
  constructor(private readonly orderService: OrderManagementService) {}

  async handle(command: UpdateBillingAddressCommand): Promise<CommandResult<OrderAddressDTO>> {
    const orderAddress = await this.orderService.updateBillingAddress(
      command.orderId,
      command.billingAddress,
    );
    return CommandResult.success(orderAddress);
  }
}
