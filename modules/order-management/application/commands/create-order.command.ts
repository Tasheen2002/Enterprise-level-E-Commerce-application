import {
  ICommand,
  ICommandHandler,
  CommandResult,
} from "../../../../packages/core/src/application/cqrs";
import { OrderManagementService } from "../services/order-management.service";
import { OrderDTO } from "../../domain/entities/order.entity";
import { AddressSnapshotData } from "../../domain/value-objects/address-snapshot.vo";

export interface CreateOrderCommand extends ICommand {
  readonly userId?: string;
  readonly guestToken?: string;
  readonly items: Array<{
    readonly variantId: string;
    readonly quantity: number;
    readonly isGift?: boolean;
    readonly giftMessage?: string;
  }>;
  readonly shippingAddress: Readonly<AddressSnapshotData>;
  readonly billingAddress?: Readonly<AddressSnapshotData>;
  readonly source?: string;
  readonly currency?: string;
}

export class CreateOrderHandler implements ICommandHandler<
  CreateOrderCommand,
  CommandResult<OrderDTO>
> {
  constructor(private readonly orderService: OrderManagementService) {}

  async handle(command: CreateOrderCommand): Promise<CommandResult<OrderDTO>> {
    const order = await this.orderService.createOrder({
      userId: command.userId,
      guestToken: command.guestToken,
      items: command.items,
      shippingAddress: command.shippingAddress,
      billingAddress: command.billingAddress,
      source: command.source,
      currency: command.currency,
    });
    return CommandResult.success(order);
  }
}