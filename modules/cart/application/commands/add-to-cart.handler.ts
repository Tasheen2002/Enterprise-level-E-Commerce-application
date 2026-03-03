import { ICommandHandler, CommandResult } from "@/api/src/shared/application";
import { CartManagementService, CartDto } from "../services/cart-management.service";
import { AddToCartCommand } from "./add-to-cart.command";

export class AddToCartHandler
  implements ICommandHandler<AddToCartCommand, CommandResult<CartDto>>
{
  constructor(private readonly cartManagementService: CartManagementService) {}

  async handle(command: AddToCartCommand): Promise<CommandResult<CartDto>> {
    try {
      const result = await this.cartManagementService.addToCart({
        cartId: command.cartId,
        userId: command.userId,
        guestToken: command.guestToken,
        variantId: command.variantId,
        quantity: command.quantity,
        appliedPromos: command.appliedPromos,
        isGift: command.isGift,
        giftMessage: command.giftMessage,
      });
      return CommandResult.success<CartDto>(result);
    } catch (error) {
      return CommandResult.failure<CartDto>(
        error instanceof Error ? error.message : "Failed to add item to cart",
      );
    }
  }
}
