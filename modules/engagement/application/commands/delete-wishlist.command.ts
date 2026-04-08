import { WishlistManagementService } from "../services/wishlist-management.service.js";

export interface ICommand {
  readonly commandId?: string;
  readonly timestamp?: Date;
}

export interface ICommandHandler<TCommand extends ICommand, TResult = void> {
  handle(command: TCommand): Promise<TResult>;
}

export class CommandResult<T = any> {
  constructor(
    public success: boolean,
    public data?: T,
    public error?: string,
    public errors?: string[]
  ) {}

  static success<T>(data?: T): CommandResult<T> {
    return new CommandResult(true, data);
  }

  static failure<T>(error: string, errors?: string[]): CommandResult<T> {
    return new CommandResult<T>(false, undefined, error, errors);
  }
}

export interface DeleteWishlistCommand extends ICommand {
  wishlistId: string;
}

export class DeleteWishlistHandler
  implements ICommandHandler<DeleteWishlistCommand, CommandResult<void>>
{
  constructor(
    private readonly wishlistService: WishlistManagementService
  ) {}

  async handle(
    command: DeleteWishlistCommand
  ): Promise<CommandResult<void>> {
    try {
      if (!command.wishlistId || command.wishlistId.trim().length === 0) {
        return CommandResult.failure<void>(
          "Wishlist ID is required",
          ["wishlistId"]
        );
      }

      await this.wishlistService.deleteWishlist(command.wishlistId);

      return CommandResult.success<void>();
    } catch (error) {
      if (error instanceof Error) {
        return CommandResult.failure<void>(
          "Failed to delete wishlist",
          [error.message]
        );
      }

      return CommandResult.failure<void>(
        "An unexpected error occurred while deleting wishlist"
      );
    }
  }
}
