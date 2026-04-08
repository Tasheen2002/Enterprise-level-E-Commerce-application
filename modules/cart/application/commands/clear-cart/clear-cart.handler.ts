import { ICommandHandler, CommandResult } from "@/api/src/shared/application";
import { CartManagementService, CartDto } from "../../services/cart-management.service";
import { ClearCartCommand } from "./clear-cart.command";

export class ClearCartHandler
  implements ICommandHandler<ClearCartCommand, CommandResult<CartDto>>
{
  constructor(private readonly cartManagementService: CartManagementService) {}

  async handle(command: ClearCartCommand): Promise<CommandResult<CartDto>> {
    try {
      const cart = await this.cartManagementService.clearCart(
        command.cartId,
        command.userId,
        command.guestToken,
      );
      return CommandResult.success<CartDto>(cart);
    } catch (error) {
      return CommandResult.failure<CartDto>(
        error instanceof Error ? error.message : "Failed to clear cart",
      );
    }
  }
}
