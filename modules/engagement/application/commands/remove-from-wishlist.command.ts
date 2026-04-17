import { ICommand, ICommandHandler, CommandResult } from "../../../../packages/core/src/application/cqrs";
import { WishlistManagementService } from "../services/wishlist-management.service";

export interface RemoveFromWishlistCommand extends ICommand {
  readonly wishlistId: string;
  readonly variantId: string;
}

export class RemoveFromWishlistHandler
  implements ICommandHandler<RemoveFromWishlistCommand, CommandResult<void>>
{
  constructor(private readonly wishlistService: WishlistManagementService) {}

  async handle(command: RemoveFromWishlistCommand): Promise<CommandResult<void>> {
    await this.wishlistService.removeFromWishlist(command.wishlistId, command.variantId);
    return CommandResult.success();
  }
}
