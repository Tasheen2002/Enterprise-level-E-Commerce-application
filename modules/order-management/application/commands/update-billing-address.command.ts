import {
  ICommand,
  ICommandHandler,
  CommandResult,
} from "../../../../packages/core/src/application/cqrs";
import { OrderManagementService } from "../services/order-management.service";
import { OrderAddressDTO } from "../../domain/entities/order-address.entity";
import { AddressSnapshotData } from "../../domain/value-objects/address-snapshot.vo";

export interface UpdateBillingAddressCommand extends ICommand {
  readonly orderId: string;
  readonly requestingUserId: string;
  readonly isStaff: boolean;
  readonly billingAddress: Readonly<AddressSnapshotData>;
}

export class UpdateBillingAddressHandler implements ICommandHandler<
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
      command.requestingUserId,
      command.isStaff,
    );
    return CommandResult.success(orderAddress);
  }
}
