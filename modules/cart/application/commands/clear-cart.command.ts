import {
  ICommand,
  ICommandHandler,
  CommandResult,
} from "../../../../packages/core/src/application/cqrs";
import {
  CartManagementService,
  CartDto,
} from "../services/cart-management.service";

export interface ClearCartCommand extends ICommand {
  readonly cartId: string;
  readonly userId?: string;
  readonly guestToken?: string;
}

export class ClearCartHandler implements ICommandHandler<
  ClearCartCommand,
  CommandResult<CartDto>
> {
  constructor(private readonly cartManagementService: CartManagementService) {}

  async handle(command: ClearCartCommand): Promise<CommandResult<CartDto>> {
    const cart = await this.cartManagementService.clearCart(
      command.cartId,
      command.userId,
      command.guestToken,
    );
    return CommandResult.success<CartDto>(cart);
  }
}
