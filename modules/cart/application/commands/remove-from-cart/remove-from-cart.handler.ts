import { ICommandHandler, CommandResult } from "@/api/src/shared/application";
import { CartManagementService, CartDto } from "../../services/cart-management.service";
import { RemoveFromCartCommand } from "./remove-from-cart.command";

export class RemoveFromCartHandler
  implements ICommandHandler<RemoveFromCartCommand, CommandResult<CartDto>>
{
  constructor(private readonly cartManagementService: CartManagementService) {}

  async handle(command: RemoveFromCartCommand): Promise<CommandResult<CartDto>> {
    try {
      const cart = await this.cartManagementService.removeFromCart({
        cartId: command.cartId,
        variantId: command.variantId,
        userId: command.userId,
        guestToken: command.guestToken,
      });
      return CommandResult.success<CartDto>(cart);
    } catch (error) {
      return CommandResult.failure<CartDto>(
        error instanceof Error ? error.message : "Failed to remove item from cart",
      );
    }
  }
}
