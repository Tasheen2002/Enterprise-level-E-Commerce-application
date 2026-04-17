import { ICommand, ICommandHandler, CommandResult } from "../../../../packages/core/src/application/cqrs";
import { WishlistManagementService } from "../services/wishlist-management.service";
import { WishlistItemDTO } from "../../domain/entities/wishlist-item.entity";

export interface AddToWishlistCommand extends ICommand {
  readonly wishlistId: string;
  readonly variantId: string;
  readonly userId?: string;
  readonly guestToken?: string;
}

export class AddToWishlistHandler
  implements ICommandHandler<AddToWishlistCommand, CommandResult<WishlistItemDTO>>
{
  constructor(private readonly wishlistService: WishlistManagementService) {}

  async handle(command: AddToWishlistCommand): Promise<CommandResult<WishlistItemDTO>> {
    const dto = await this.wishlistService.addToWishlist(
      command.wishlistId,
      command.variantId,
      { userId: command.userId, guestToken: command.guestToken },
    );
    return CommandResult.success(dto);
  }
}
