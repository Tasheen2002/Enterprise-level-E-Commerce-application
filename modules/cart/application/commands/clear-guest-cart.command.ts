import { ICommand, ICommandHandler, CommandResult } from "../../../../packages/core/src/application/cqrs";
import { CartManagementService } from "../services/cart-management.service";

export interface ClearGuestCartCommand extends ICommand {
  readonly guestToken: string;
}

export class ClearGuestCartHandler implements ICommandHandler<ClearGuestCartCommand, CommandResult<void>> {
  constructor(private readonly cartManagementService: CartManagementService) {}

  async handle(command: ClearGuestCartCommand): Promise<CommandResult<void>> {
    const activeCart = await this.cartManagementService.getActiveCartByGuestToken(command.guestToken);
    if (!activeCart) {
      return CommandResult.failure("No active cart found for this guest");
    }
    await this.cartManagementService.clearCart(activeCart.cartId, undefined, command.guestToken);
    return CommandResult.success<void>(undefined);
  }
}