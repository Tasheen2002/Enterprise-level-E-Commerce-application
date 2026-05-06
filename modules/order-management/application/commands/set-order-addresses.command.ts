import {
  ICommand,
  ICommandHandler,
  CommandResult,
} from "../../../../packages/core/src/application/cqrs";
import { OrderManagementService } from "../services/order-management.service";
import { OrderAddressDTO } from "../../domain/entities/order-address.entity";
import { AddressSnapshotData } from "../../domain/value-objects/address-snapshot.vo";

export interface SetOrderAddressesCommand extends ICommand {
  readonly orderId: string;
  readonly requestingUserId: string;
  readonly isStaff: boolean;
  readonly billingAddress: Readonly<AddressSnapshotData>;
  readonly shippingAddress: Readonly<AddressSnapshotData>;
}

export class SetOrderAddressesHandler implements ICommandHandler<
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
      command.requestingUserId,
      command.isStaff,
    );
    return CommandResult.success(orderAddress);
  }
}
