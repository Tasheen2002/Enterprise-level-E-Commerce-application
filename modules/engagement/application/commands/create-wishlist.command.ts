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

export interface CreateWishlistCommand extends ICommand {
  userId?: string;
  guestToken?: string;
  name?: string;
  isDefault?: boolean;
  isPublic?: boolean;
  description?: string;
}

export interface WishlistResult {
  wishlistId: string;
  userId?: string;
  guestToken?: string;
  name?: string;
  isDefault: boolean;
  isPublic: boolean;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class CreateWishlistHandler
  implements ICommandHandler<CreateWishlistCommand, CommandResult<WishlistResult>>
{
  constructor(
    private readonly wishlistService: WishlistManagementService
  ) {}

  async handle(
    command: CreateWishlistCommand
  ): Promise<CommandResult<WishlistResult>> {
    try {
      // Validation: must have either userId or guestToken
      if (!command.userId && !command.guestToken) {
        return CommandResult.failure<WishlistResult>(
          "Either userId or guestToken is required",
          ["userId", "guestToken"]
        );
      }

      // Validation: cannot have both
      if (command.userId && command.guestToken) {
        return CommandResult.failure<WishlistResult>(
          "Cannot specify both userId and guestToken",
          ["userId", "guestToken"]
        );
      }

      const wishlist = await this.wishlistService.createWishlist({
        userId: command.userId,
        guestToken: command.guestToken,
        name: command.name,
        isDefault: command.isDefault,
        isPublic: command.isPublic,
        description: command.description,
      });

      const result: WishlistResult = {
        wishlistId: wishlist.getWishlistId().getValue(),
        userId: wishlist.getUserId(),
        guestToken: wishlist.getGuestToken(),
        name: wishlist.getName(),
        isDefault: wishlist.getIsDefault(),
        isPublic: wishlist.getIsPublic(),
        description: wishlist.getDescription(),
        createdAt: wishlist.getCreatedAt(),
        updatedAt: wishlist.getUpdatedAt(),
      };

      return CommandResult.success<WishlistResult>(result);
    } catch (error) {
      if (error instanceof Error) {
        return CommandResult.failure<WishlistResult>(
          "Failed to create wishlist",
          [error.message]
        );
      }

      return CommandResult.failure<WishlistResult>(
        "An unexpected error occurred while creating wishlist"
      );
    }
  }
}
