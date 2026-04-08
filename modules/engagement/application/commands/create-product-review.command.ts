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

export interface CreateProductReviewCommand extends ICommand {
  productId: string;
  userId: string;
  rating: number;
  title?: string;
  body?: string;
}

export interface ProductReviewResult {
  reviewId: string;
  productId: string;
  userId: string;
  rating: number;
  title?: string;
  body?: string;
  status: string;
  createdAt: Date;
}

export class CreateProductReviewHandler
  implements ICommandHandler<CreateProductReviewCommand, CommandResult<ProductReviewResult>>
{
  constructor(
    private readonly reviewService: ProductReviewService
  ) {}

  async handle(
    command: CreateProductReviewCommand
  ): Promise<CommandResult<ProductReviewResult>> {
    try {
      if (!command.productId || command.productId.trim().length === 0) {
        return CommandResult.failure<ProductReviewResult>(
          "Product ID is required",
          ["productId"]
        );
      }

      if (!command.userId || command.userId.trim().length === 0) {
        return CommandResult.failure<ProductReviewResult>(
          "User ID is required",
          ["userId"]
        );
      }

      if (command.rating === undefined || command.rating === null) {
        return CommandResult.failure<ProductReviewResult>(
          "Rating is required",
          ["rating"]
        );
      }

      if (command.rating < 1 || command.rating > 5) {
        return CommandResult.failure<ProductReviewResult>(
          "Rating must be between 1 and 5",
          ["rating"]
        );
      }

      const review = await this.reviewService.createReview({
        productId: command.productId,
        userId: command.userId,
        rating: command.rating,
        title: command.title,
        body: command.body,
      });

      const result: ProductReviewResult = {
        reviewId: review.getReviewId().getValue(),
        productId: review.getProductId(),
        userId: review.getUserId(),
        rating: review.getRating().getValue(),
        title: review.getTitle(),
        body: review.getBody(),
        status: review.getStatus().getValue(),
        createdAt: review.getCreatedAt(),
      };

      return CommandResult.success<ProductReviewResult>(result);
    } catch (error) {
      if (error instanceof Error) {
        return CommandResult.failure<ProductReviewResult>(
          "Failed to create product review",
          [error.message]
        );
      }

      return CommandResult.failure<ProductReviewResult>(
        "An unexpected error occurred while creating product review"
      );
    }
  }
}
