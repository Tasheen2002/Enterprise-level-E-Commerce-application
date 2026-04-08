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

export interface UpdateWishlistCommand extends ICommand {
  wishlistId: string;
  name?: string;
  description?: string;
  isPublic?: boolean;
}

export class UpdateWishlistHandler
  implements ICommandHandler<UpdateWishlistCommand, CommandResult<void>>
{
  constructor(
    private readonly wishlistService: WishlistManagementService
  ) {}

  async handle(
    command: UpdateWishlistCommand
  ): Promise<CommandResult<void>> {
    try {
      if (!command.wishlistId || command.wishlistId.trim().length === 0) {
        return CommandResult.failure<void>(
          "Wishlist ID is required",
          ["wishlistId"]
        );
      }

      // Update name if provided
      if (command.name !== undefined) {
        if (command.name.trim().length === 0) {
          return CommandResult.failure<void>(
            "Wishlist name cannot be empty",
            ["name"]
          );
        }
        await this.wishlistService.updateWishlistName(
          command.wishlistId,
          command.name
        );
      }

      // Update description if provided
      if (command.description !== undefined) {
        await this.wishlistService.updateWishlistDescription(
          command.wishlistId,
          command.description
        );
      }

      // Update visibility if provided
      if (command.isPublic !== undefined) {
        if (command.isPublic) {
          await this.wishlistService.makeWishlistPublic(command.wishlistId);
        } else {
          await this.wishlistService.makeWishlistPrivate(command.wishlistId);
        }
      }

      return CommandResult.success<void>();
    } catch (error) {
      if (error instanceof Error) {
        return CommandResult.failure<void>(
          "Failed to update wishlist",
          [error.message]
        );
      }

      return CommandResult.failure<void>(
        "An unexpected error occurred while updating wishlist"
      );
    }
  }
}
