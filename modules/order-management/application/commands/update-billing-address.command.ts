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

export class UpdateBillingAddressCommandHandler implements ICommandHandler<
  UpdateBillingAddressCommand,
  CommandResult<OrderAddressDTO>
> {
  constructor(private readonly orderService: OrderManagementService) {}

  async handle(
    command: UpdateBillingAddressCommand,
  ): Promise<CommandResult<OrderAddressDTO>> {
    const orderAddress = await this.orderService.updateBillingAddress(
      command.orderId,
      command.billingAddress,
    );
    return CommandResult.success(orderAddress);
  }
}
