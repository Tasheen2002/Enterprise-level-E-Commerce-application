import {
  ICommand,
  ICommandHandler,
  CommandResult,
} from "../../../../packages/core/src/application/cqrs";
import { OrderManagementService } from "../services/order-management.service";
import { OrderAddressDTO } from "../../domain/entities/order-address.entity";

export interface UpdateShippingAddressCommand extends ICommand {
  readonly orderId: string;
  readonly shippingAddress: {
    readonly firstName: string;
    readonly lastName: string;
    readonly addressLine1: string;
    readonly addressLine2?: string;
    readonly city: string;
    readonly state: string;
    readonly postalCode: string;
    readonly country: string;
    readonly phone?: string;
    readonly email?: string;
  };
}

export class UpdateShippingAddressCommandHandler implements ICommandHandler<
  UpdateShippingAddressCommand,
  CommandResult<OrderAddressDTO>
> {
  constructor(private readonly orderService: OrderManagementService) {}

  async handle(
    command: UpdateShippingAddressCommand,
  ): Promise<CommandResult<OrderAddressDTO>> {
    const orderAddress = await this.orderService.updateShippingAddress(
      command.orderId,
      command.shippingAddress,
    );
    return CommandResult.success(orderAddress);
  }
}
