import { ICommand, ICommandHandler, CommandResult } from "../../../../packages/core/src/application/cqrs";
import { ProductReviewService } from "../services/product-review.service";

export interface UpdateReviewStatusCommand extends ICommand {
  readonly reviewId: string;
  readonly status: "approved" | "rejected" | "flagged";
}

export class UpdateReviewStatusHandler
  implements ICommandHandler<UpdateReviewStatusCommand, CommandResult<void>>
{
  constructor(private readonly reviewService: ProductReviewService) {}

  async handle(command: UpdateReviewStatusCommand): Promise<CommandResult<void>> {
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
    }
    return CommandResult.success();
  }
}
