import { ICommand, ICommandHandler, CommandResult } from "../../../../packages/core/src/application/cqrs";
import { WishlistManagementService } from "../services/wishlist-management.service";
import { WishlistDTO } from "../../domain/entities/wishlist.entity";

export interface TransferWishlistCommand extends ICommand {
  readonly guestWishlistId: string;
  readonly guestToken: string;
  readonly userId: string;
}

export class TransferWishlistHandler
  implements ICommandHandler<TransferWishlistCommand, CommandResult<WishlistDTO>>
{
  constructor(private readonly wishlistService: WishlistManagementService) {}

  async handle(command: TransferWishlistCommand): Promise<CommandResult<WishlistDTO>> {
    const dto = await this.wishlistService.mergeOrTransferWishlist(
      command.guestWishlistId,
      command.guestToken,
      command.userId,
    );
    return CommandResult.success(dto);
  }
}
