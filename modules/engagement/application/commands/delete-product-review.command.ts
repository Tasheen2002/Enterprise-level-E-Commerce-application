import { ICommand, ICommandHandler, CommandResult } from "../../../../packages/core/src/application/cqrs";
import { ProductReviewService } from "../services/product-review.service";

export interface DeleteProductReviewCommand extends ICommand {
  readonly reviewId: string;
}

export class DeleteProductReviewHandler
  implements ICommandHandler<DeleteProductReviewCommand, CommandResult<void>>
{
  constructor(private readonly reviewService: ProductReviewService) {}

  async handle(command: DeleteProductReviewCommand): Promise<CommandResult<void>> {
    await this.reviewService.deleteReview(command.reviewId);
    return CommandResult.success();
  }
}
