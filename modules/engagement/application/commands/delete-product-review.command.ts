import { ICommand, ICommandHandler, CommandResult } from "../../../../packages/core/src/application/cqrs";
import { ProductReviewService } from "../services/product-review.service";
import { ProductReviewNotFoundError } from "../../domain/errors/engagement.errors";

export interface DeleteProductReviewCommand extends ICommand {
  readonly reviewId: string;
  /** Reviews can be deleted by their author or an admin. */
  readonly actor: { userId: string; isAdmin: boolean };
}

export class DeleteProductReviewHandler
  implements ICommandHandler<DeleteProductReviewCommand, CommandResult<void>>
{
  constructor(private readonly reviewService: ProductReviewService) {}

  async handle(command: DeleteProductReviewCommand): Promise<CommandResult<void>> {
    const review = await this.reviewService.getReviewById(command.reviewId);
    if (!review || (!command.actor.isAdmin && review.userId !== command.actor.userId)) {
      throw new ProductReviewNotFoundError(command.reviewId);
    }
    await this.reviewService.deleteReview(command.reviewId);
    return CommandResult.success();
  }
}
