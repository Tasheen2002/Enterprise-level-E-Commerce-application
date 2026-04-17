import { ICommand, ICommandHandler, CommandResult } from "../../../../packages/core/src/application/cqrs";
import { CartManagementService, CartDto } from "../services/cart-management.service";

export interface ClearUserCartCommand extends ICommand {
  readonly userId: string;
}

export class ClearUserCartHandler implements ICommandHandler<ClearUserCartCommand, CommandResult<CartDto>> {
  constructor(private readonly cartManagementService: CartManagementService) {}

  async handle(command: ClearUserCartCommand): Promise<CommandResult<CartDto>> {
    const activeCart = await this.cartManagementService.getActiveCartByUser(command.userId);
    if (!activeCart) {
      return CommandResult.failure("No active cart found for this user");
    }
    const cart = await this.cartManagementService.clearCart(activeCart.cartId, command.userId);
    return CommandResult.success<CartDto>(cart);
  }
}