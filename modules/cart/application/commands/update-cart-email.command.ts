import { ICommand, ICommandHandler, CommandResult } from "../../../../packages/core/src/application/cqrs";
import { CartManagementService, CartDto } from "../services/cart-management.service";

export interface UpdateCartEmailCommand extends ICommand {
  cartId: string;
  email: string;
  userId?: string;
  guestToken?: string;
}

export class UpdateCartEmailHandler implements ICommandHandler<UpdateCartEmailCommand, CommandResult<CartDto>> {
  constructor(private readonly cartManagementService: CartManagementService) {}

  async handle(command: UpdateCartEmailCommand): Promise<CommandResult<CartDto>> {
    await this.cartManagementService.updateCartEmail(
      command.cartId,
      command.email,
      command.userId,
      command.guestToken,
    );
    const cart = await this.cartManagementService.getCart(
      command.cartId,
      command.userId,
      command.guestToken,
    );
    return CommandResult.success<CartDto>(cart!);
  }
}
