import { ICommandHandler, CommandResult } from "@/api/src/shared/application";
import { CartManagementService, CartDto } from "../../services/cart-management.service";
import { UpdateCartItemCommand } from "./update-cart-item.command";

export class UpdateCartItemHandler
  implements ICommandHandler<UpdateCartItemCommand, CommandResult<CartDto>>
{
  constructor(private readonly cartManagementService: CartManagementService) {}

  async handle(command: UpdateCartItemCommand): Promise<CommandResult<CartDto>> {
    try {
      const cart = await this.cartManagementService.updateCartItem({
        cartId: command.cartId,
        variantId: command.variantId,
        quantity: command.quantity,
        userId: command.userId,
        guestToken: command.guestToken,
      });
      return CommandResult.success<CartDto>(cart);
    } catch (error) {
      return CommandResult.failure<CartDto>(
        error instanceof Error ? error.message : "Failed to update cart item",
      );
    }
  }
}
