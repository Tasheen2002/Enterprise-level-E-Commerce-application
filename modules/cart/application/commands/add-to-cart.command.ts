import {
  ICommand,
  ICommandHandler,
  CommandResult,
} from "@/api/src/shared/application";
import { PromoData } from "../../domain/value-objects/applied-promos.vo";
import {
  CartManagementService,
  CartDto,
} from "../services/cart-management.service";

export interface AddToCartCommand extends ICommand {
  cartId?: string;
  userId?: string;
  guestToken?: string;
  variantId: string;
  quantity: number;
  appliedPromos?: PromoData[];
  isGift?: boolean;
  giftMessage?: string;
}

export class AddToCartHandler
  implements ICommandHandler<AddToCartCommand, CommandResult<CartDto>>
{
  constructor(private readonly cartManagementService: CartManagementService) {}

  async handle(command: AddToCartCommand): Promise<CommandResult<CartDto>> {
    try {
      const errors: string[] = [];

      if (!command.variantId || command.variantId.trim().length === 0) {
        errors.push("variantId: Variant ID is required");
      }

      if (!command.quantity || command.quantity <= 0) {
        errors.push("quantity: Quantity must be greater than 0");
      }

      const hasUserIdentifier = command.userId || command.guestToken;
      if (!hasUserIdentifier && !command.cartId) {
        errors.push("userId or guestToken: Either userId or guestToken is required");
      }

      if (command.userId && command.guestToken) {
        errors.push("userId or guestToken: Cannot provide both userId and guestToken");
      }

      if (errors.length > 0) {
        return CommandResult.failure<CartDto>("Validation failed", errors);
      }

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
        [error instanceof Error ? error.message : "Unknown error"],
      );
    }
  }
}
