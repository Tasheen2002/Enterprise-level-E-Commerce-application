import { ICommand, ICommandHandler, CommandResult } from "../../../../packages/core/src/application/cqrs";
import { WishlistManagementService } from "../services/wishlist-management.service";

export interface DeleteWishlistCommand extends ICommand {
  readonly wishlistId: string;
}

export class DeleteWishlistHandler
  implements ICommandHandler<DeleteWishlistCommand, CommandResult<void>>
{
  constructor(private readonly wishlistService: WishlistManagementService) {}

  async handle(command: DeleteWishlistCommand): Promise<CommandResult<void>> {
    await this.wishlistService.deleteWishlist(command.wishlistId);
    return CommandResult.success();
  }
}
