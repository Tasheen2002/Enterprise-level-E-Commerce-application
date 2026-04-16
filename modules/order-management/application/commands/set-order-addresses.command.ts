import { ICommand, ICommandHandler, CommandResult } from "../../../../packages/core/src/application/cqrs";
import { OrderManagementService } from "../services/order-management.service";
import { OrderAddressDTO } from "../../domain/entities/order-address.entity";

export interface SetOrderAddressesCommand extends ICommand {
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
  readonly shippingAddress: {
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
  CommandResult<OrderAddressDTO>
> {
  constructor(private readonly orderService: OrderManagementService) {}

  async handle(
    command: SetOrderAddressesCommand,
  ): Promise<CommandResult<OrderAddressDTO>> {
    const orderAddress = await this.orderService.setOrderAddress(
      command.orderId,
      command.billingAddress,
      command.shippingAddress,
    );
    return CommandResult.success(orderAddress);
  }
}
