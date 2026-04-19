import { ICommand, ICommandHandler, CommandResult } from "../../../../packages/core/src/application/cqrs";
import { CartManagementService } from "../services/cart-management.service";

export interface ClearUserCartCommand extends ICommand {
  readonly userId: string;
}

export class ClearUserCartHandler implements ICommandHandler<ClearUserCartCommand, CommandResult<void>> {
  constructor(private readonly cartManagementService: CartManagementService) {}

  async handle(command: ClearUserCartCommand): Promise<CommandResult<void>> {
    const activeCart = await this.cartManagementService.getActiveCartByUser(command.userId);
    if (!activeCart) {
      return CommandResult.failure("No active cart found for this user");
    }
    await this.cartManagementService.clearCart(activeCart.cartId, command.userId);
    return CommandResult.success<void>(undefined);
  }
}