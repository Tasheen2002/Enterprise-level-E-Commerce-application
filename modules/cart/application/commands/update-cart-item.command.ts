import { ICommand, ICommandHandler, CommandResult } from "../../../../packages/core/src/application/cqrs";
import { CartManagementService, CartDto } from "../services/cart-management.service";

export interface UpdateCartItemCommand extends ICommand {
  cartId: string;
  variantId: string;
  quantity: number;
  userId?: string;
  guestToken?: string;
}

export class UpdateCartItemHandler implements ICommandHandler<UpdateCartItemCommand, CommandResult<CartDto>> {
  constructor(private readonly cartManagementService: CartManagementService) {}

  async handle(command: UpdateCartItemCommand): Promise<CommandResult<CartDto>> {
    const cart = await this.cartManagementService.updateCartItem({
      cartId: command.cartId,
      variantId: command.variantId,
      quantity: command.quantity,
      userId: command.userId,
      guestToken: command.guestToken,
    });
    return CommandResult.success<CartDto>(cart);
  }
}
