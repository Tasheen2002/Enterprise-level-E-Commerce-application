import { ICommand, ICommandHandler, CommandResult } from "../../../../packages/core/src/application/cqrs";
import { CartManagementService, CartDto } from "../services/cart-management.service";

export interface TransferCartCommand extends ICommand {
  guestToken: string;
  userId: string;
  mergeWithExisting?: boolean;
}

export class TransferCartHandler implements ICommandHandler<TransferCartCommand, CommandResult<CartDto>> {
  constructor(private readonly cartManagementService: CartManagementService) {}

  async handle(command: TransferCartCommand): Promise<CommandResult<CartDto>> {
    const cart = await this.cartManagementService.transferGuestCartToUser({
      guestToken: command.guestToken,
      userId: command.userId,
      mergeWithExisting: command.mergeWithExisting,
    });
    return CommandResult.success<CartDto>(cart);
  }
}
