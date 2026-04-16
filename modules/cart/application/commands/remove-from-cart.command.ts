import {
  ICommand,
  ICommandHandler,
  CommandResult,
} from "../../../../packages/core/src/application/cqrs";
import {
  CartManagementService,
  CartDto,
} from "../services/cart-management.service";

export interface RemoveFromCartCommand extends ICommand {
  readonly cartId: string;
  readonly variantId: string;
  readonly userId?: string;
  readonly guestToken?: string;
}

export class RemoveFromCartHandler implements ICommandHandler<
  RemoveFromCartCommand,
  CommandResult<CartDto>
> {
  constructor(private readonly cartManagementService: CartManagementService) {}

  async handle(
    command: RemoveFromCartCommand,
  ): Promise<CommandResult<CartDto>> {
    const cart = await this.cartManagementService.removeFromCart({
      cartId: command.cartId,
      variantId: command.variantId,
      userId: command.userId,
      guestToken: command.guestToken,
    });
    return CommandResult.success<CartDto>(cart);
  }
}
