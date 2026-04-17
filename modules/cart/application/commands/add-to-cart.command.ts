import {
  ICommand,
  ICommandHandler,
  CommandResult,
} from "../../../../packages/core/src/application/cqrs";
import { PromoData } from "../../domain/value-objects/applied-promos.vo";
import {
  CartManagementService,
  CartDto,
} from "../services/cart-management.service";

export interface AddToCartCommand extends ICommand {
  readonly cartId?: string;
  readonly userId?: string;
  readonly guestToken?: string;
  readonly variantId: string;
  readonly quantity: number;
  readonly appliedPromos?: PromoData[];
  readonly isGift?: boolean;
  readonly giftMessage?: string;
}

export class AddToCartHandler implements ICommandHandler<
  AddToCartCommand,
  CommandResult<CartDto>
> {
  constructor(private readonly cartManagementService: CartManagementService) {}

  async handle(command: AddToCartCommand): Promise<CommandResult<CartDto>> {
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
  }
}
