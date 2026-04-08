import { ProductReviewService } from "../services/product-review.service.js";

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

export interface DeleteProductReviewCommand extends ICommand {
  reviewId: string;
}

export class DeleteProductReviewHandler
  implements ICommandHandler<DeleteProductReviewCommand, CommandResult<void>>
{
  constructor(
    private readonly reviewService: ProductReviewService
  ) {}

  async handle(
    command: DeleteProductReviewCommand
  ): Promise<CommandResult<void>> {
    try {
      if (!command.reviewId || command.reviewId.trim().length === 0) {
        return CommandResult.failure<void>(
          "Review ID is required",
          ["reviewId"]
        );
      }

      await this.reviewService.deleteReview(command.reviewId);

      return CommandResult.success<void>();
    } catch (error) {
      if (error instanceof Error) {
        return CommandResult.failure<void>(
          "Failed to delete product review",
          [error.message]
        );
      }

      return CommandResult.failure<void>(
        "An unexpected error occurred while deleting product review"
      );
    }
  }
}
