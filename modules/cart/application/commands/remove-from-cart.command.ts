import {
  ICommand,
  ICommandHandler,
  CommandResult,
} from "../../../../packages/core/src/application/cqrs";
import { CartManagementService } from "../services/cart-management.service";

export interface RemoveFromCartCommand extends ICommand {
  readonly cartId: string;
  readonly variantId: string;
  readonly userId?: string;
  readonly guestToken?: string;
}

export class RemoveFromCartHandler implements ICommandHandler<
  RemoveFromCartCommand,
  CommandResult<void>
> {
  constructor(private readonly cartManagementService: CartManagementService) {}

  async handle(command: RemoveFromCartCommand): Promise<CommandResult<void>> {
    await this.cartManagementService.removeFromCart({
      cartId: command.cartId,
      variantId: command.variantId,
      userId: command.userId,
      guestToken: command.guestToken,
    });
    return CommandResult.success<void>(undefined);
  }
}
