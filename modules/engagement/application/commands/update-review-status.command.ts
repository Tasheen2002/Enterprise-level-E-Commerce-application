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

export interface UpdateReviewStatusCommand extends ICommand {
  reviewId: string;
  status: "approved" | "rejected" | "flagged";
}

export class UpdateReviewStatusHandler
  implements ICommandHandler<UpdateReviewStatusCommand, CommandResult<void>>
{
  constructor(
    private readonly reviewService: ProductReviewService
  ) {}

  async handle(
    command: UpdateReviewStatusCommand
  ): Promise<CommandResult<void>> {
    try {
      if (!command.reviewId || command.reviewId.trim().length === 0) {
        return CommandResult.failure<void>(
          "Review ID is required",
          ["reviewId"]
        );
      }

      if (!command.status) {
        return CommandResult.failure<void>(
          "Status is required",
          ["status"]
        );
      }

      switch (command.status) {
        case "approved":
          await this.reviewService.approveReview(command.reviewId);
          break;
        case "rejected":
          await this.reviewService.rejectReview(command.reviewId);
          break;
        case "flagged":
          await this.reviewService.flagReview(command.reviewId);
          break;
        default:
          return CommandResult.failure<void>(
            "Invalid status value. Must be: approved, rejected, or flagged",
            ["status"]
          );
      }

      return CommandResult.success<void>();
    } catch (error) {
      if (error instanceof Error) {
        return CommandResult.failure<void>(
          "Failed to update review status",
          [error.message]
        );
      }

      return CommandResult.failure<void>(
        "An unexpected error occurred while updating review status"
      );
    }
  }
}
