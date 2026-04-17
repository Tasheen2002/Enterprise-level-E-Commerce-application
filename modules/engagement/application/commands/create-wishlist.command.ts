import { ICommand, ICommandHandler, CommandResult } from "../../../../packages/core/src/application/cqrs";
import { WishlistManagementService } from "../services/wishlist-management.service";
import { WishlistDTO } from "../../domain/entities/wishlist.entity";

export interface CreateWishlistCommand extends ICommand {
  readonly userId?: string;
  readonly guestToken?: string;
  readonly name?: string;
  readonly isDefault?: boolean;
  readonly isPublic?: boolean;
  readonly description?: string;
}

export class CreateWishlistHandler
  implements ICommandHandler<CreateWishlistCommand, CommandResult<WishlistDTO>>
{
  constructor(private readonly wishlistService: WishlistManagementService) {}

  async handle(command: CreateWishlistCommand): Promise<CommandResult<WishlistDTO>> {
    const dto = await this.wishlistService.createWishlist({
      userId: command.userId,
      guestToken: command.guestToken,
      name: command.name,
      isDefault: command.isDefault,
      isPublic: command.isPublic,
      description: command.description,
    });
    return CommandResult.success(dto);
  }
}
