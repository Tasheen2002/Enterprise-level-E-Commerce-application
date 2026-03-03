import { ICommandHandler, CommandResult } from "@/api/src/shared/application";
import { CartManagementService, CartDto } from "../services/cart-management.service";
import { TransferCartCommand } from "./transfer-cart.command";

export class TransferCartHandler
  implements ICommandHandler<TransferCartCommand, CommandResult<CartDto>>
{
  constructor(private readonly cartManagementService: CartManagementService) {}

  async handle(command: TransferCartCommand): Promise<CommandResult<CartDto>> {
    try {
      const cart = await this.cartManagementService.transferGuestCartToUser({
        guestToken: command.guestToken,
        userId: command.userId,
        mergeWithExisting: command.mergeWithExisting,
      });
      return CommandResult.success<CartDto>(cart);
    } catch (error) {
      return CommandResult.failure<CartDto>(
        error instanceof Error ? error.message : "Failed to transfer cart",
      );
    }
  }
}
