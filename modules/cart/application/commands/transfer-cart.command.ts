import {
  ICommand,
  ICommandHandler,
  CommandResult,
} from "@/api/src/shared/application";
import {
  CartManagementService,
  CartDto,
} from "../services/cart-management.service";

export interface TransferCartCommand extends ICommand {
  guestToken: string;
  userId: string;
  mergeWithExisting?: boolean;
}

export class TransferCartHandler
  implements ICommandHandler<TransferCartCommand, CommandResult<CartDto>>
{
  constructor(private readonly cartManagementService: CartManagementService) {}

  async handle(command: TransferCartCommand): Promise<CommandResult<CartDto>> {
    try {
      const errors: string[] = [];

      if (!command.guestToken || command.guestToken.trim().length === 0) {
        errors.push("guestToken: Guest token is required");
      }

      if (!command.userId || command.userId.trim().length === 0) {
        errors.push("userId: User ID is required");
      }

      if (errors.length > 0) {
        return CommandResult.failure<CartDto>("Validation failed", errors);
      }

      const cart = await this.cartManagementService.transferGuestCartToUser({
        guestToken: command.guestToken,
        userId: command.userId,
        mergeWithExisting: command.mergeWithExisting,
      });

      return CommandResult.success<CartDto>(cart);
    } catch (error) {
      return CommandResult.failure<CartDto>(
        error instanceof Error ? error.message : "Failed to transfer cart",
        [error instanceof Error ? error.message : "Unknown error"],
      );
    }
  }
}
