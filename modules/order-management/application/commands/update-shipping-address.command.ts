import {
  ICommand,
  ICommandHandler,
  CommandResult,
} from "../../../../packages/core/src/application/cqrs";
import { OrderManagementService } from "../services/order-management.service";
import {
  OrderAddress,
  OrderAddressDTO,
} from "../../domain/entities/order-address.entity";

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
  CommandResult<OrderAddressDTO>
> {
  constructor(private orderService: OrderManagementService) {}

  async handle(
    command: UpdateShippingAddressCommand,
  ): Promise<CommandResult<OrderAddressDTO>> {
    const orderAddress = await this.orderService.updateShippingAddress(
      command.orderId,
      command.shippingAddress,
    );

    return CommandResult.success(OrderAddress.toDTO(orderAddress));
  }
}
