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

export interface AddToWishlistCommand extends ICommand {
  wishlistId: string;
  variantId: string;
  userId?: string;
  guestToken?: string;
}

export interface WishlistItemResult {
  wishlistId: string;
  variantId: string;
}

export class AddToWishlistHandler
  implements ICommandHandler<AddToWishlistCommand, CommandResult<WishlistItemResult>>
{
  constructor(
    private readonly wishlistService: WishlistManagementService
  ) {}

  async handle(
    command: AddToWishlistCommand
  ): Promise<CommandResult<WishlistItemResult>> {
    try {
      if (!command.wishlistId || command.wishlistId.trim().length === 0) {
        return CommandResult.failure<WishlistItemResult>(
          "Wishlist ID is required",
          ["wishlistId"]
        );
      }

      if (!command.variantId || command.variantId.trim().length === 0) {
        return CommandResult.failure<WishlistItemResult>(
          "Variant ID is required",
          ["variantId"]
        );
      }

      const item = await this.wishlistService.addToWishlist(
        command.wishlistId,
        command.variantId,
        {
          userId: command.userId,
          guestToken: command.guestToken,
        }
      );

      const result: WishlistItemResult = {
        wishlistId: item.getWishlistId(),
        variantId: item.getVariantId(),
      };

      return CommandResult.success<WishlistItemResult>(result);
    } catch (error) {
      if (error instanceof Error) {
        // Return the actual error message as the main error
        return CommandResult.failure<WishlistItemResult>(
          error.message,
          [error.message]
        );
      }

      return CommandResult.failure<WishlistItemResult>(
        "An unexpected error occurred while adding item to wishlist",
        ["Unknown error occurred"]
      );
    }
  }
}
