import { ICommand, ICommandHandler, CommandResult } from "../../../../packages/core/src/application/cqrs";
import { WishlistManagementService } from "../services/wishlist-management.service";

export interface UpdateWishlistCommand extends ICommand {
  readonly wishlistId: string;
  readonly name?: string;
  readonly description?: string;
  readonly isPublic?: boolean;
}

export class UpdateWishlistHandler
  implements ICommandHandler<UpdateWishlistCommand, CommandResult<void>>
{
  constructor(private readonly wishlistService: WishlistManagementService) {}

  async handle(command: UpdateWishlistCommand): Promise<CommandResult<void>> {
    if (command.name === undefined && command.description === undefined && command.isPublic === undefined) {
      return CommandResult.failure("At least one field must be provided to update");
    }
    if (command.name !== undefined) {
      await this.wishlistService.updateWishlistName(command.wishlistId, command.name);
    }
    if (command.description !== undefined) {
      await this.wishlistService.updateWishlistDescription(command.wishlistId, command.description);
    }
    if (command.isPublic !== undefined) {
      if (command.isPublic) {
        await this.wishlistService.makeWishlistPublic(command.wishlistId);
      } else {
        await this.wishlistService.makeWishlistPrivate(command.wishlistId);
      }
    }
    return CommandResult.success();
  }
}
