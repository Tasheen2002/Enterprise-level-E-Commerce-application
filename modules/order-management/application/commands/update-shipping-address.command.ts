import {
  ICommand,
  ICommandHandler,
  CommandResult,
} from "../../../../packages/core/src/application/cqrs";
import { OrderManagementService } from "../services/order-management.service";
import { OrderAddressDTO } from "../../domain/entities/order-address.entity";
import { AddressSnapshotData } from "../../domain/value-objects/address-snapshot.vo";

export interface UpdateShippingAddressCommand extends ICommand {
  readonly orderId: string;
  readonly requestingUserId: string;
  readonly isStaff: boolean;
  readonly shippingAddress: Readonly<AddressSnapshotData>;
}

export class UpdateShippingAddressHandler implements ICommandHandler<
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
      command.requestingUserId,
      command.isStaff,
    );
    return CommandResult.success(orderAddress);
  }
}
