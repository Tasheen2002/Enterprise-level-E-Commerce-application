import { ICommand, ICommandHandler, CommandResult } from "../../../../packages/core/src/application/cqrs";
import { CartManagementService, CartDto } from "../services/cart-management.service";

export interface UpdateCartShippingInfoCommand extends ICommand {
  cartId: string;
  shippingMethod?: string;
  shippingOption?: string;
  isGift?: boolean;
  userId?: string;
  guestToken?: string;
}

export class UpdateCartShippingInfoHandler implements ICommandHandler<UpdateCartShippingInfoCommand, CommandResult<CartDto>> {
  constructor(private readonly cartManagementService: CartManagementService) {}

  async handle(command: UpdateCartShippingInfoCommand): Promise<CommandResult<CartDto>> {
    await this.cartManagementService.updateCartShippingInfo(
      command.cartId,
      {
        shippingMethod: command.shippingMethod,
        shippingOption: command.shippingOption,
        isGift: command.isGift,
      },
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
