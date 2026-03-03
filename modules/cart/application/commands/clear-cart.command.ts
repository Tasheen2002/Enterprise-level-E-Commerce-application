import {
  ICommand,
  ICommandHandler,
  CommandResult,
} from "@/api/src/shared/application";
import {
  CartManagementService,
  CartDto,
} from "../services/cart-management.service";

export interface ClearCartCommand extends ICommand {
  cartId: string;
  userId?: string;
  guestToken?: string;
}

export class ClearCartHandler
  implements ICommandHandler<ClearCartCommand, CommandResult<CartDto>>
{
  constructor(private readonly cartManagementService: CartManagementService) {}

  async handle(command: ClearCartCommand): Promise<CommandResult<CartDto>> {
    try {
      const errors: string[] = [];

      if (!command.cartId || command.cartId.trim().length === 0) {
        errors.push("cartId: Cart ID is required");
      }

      if (command.userId && command.guestToken) {
        errors.push("userId or guestToken: Only one of userId or guestToken should be provided");
      }

      if (errors.length > 0) {
        return CommandResult.failure<CartDto>("Validation failed", errors);
      }

      const cart = await this.cartManagementService.clearCart(
        command.cartId,
        command.userId,
        command.guestToken,
      );

      return CommandResult.success<CartDto>(cart);
    } catch (error) {
      return CommandResult.failure<CartDto>(
        error instanceof Error ? error.message : "Failed to clear cart",
        [error instanceof Error ? error.message : "Unknown error"],
      );
    }
  }
}
