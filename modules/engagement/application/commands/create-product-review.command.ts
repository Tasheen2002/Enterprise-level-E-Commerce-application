import { ICommand, ICommandHandler, CommandResult } from "../../../../packages/core/src/application/cqrs";
import { ProductReviewService } from "../services/product-review.service";
import { ReviewDTO } from "../../domain/entities/product-review.entity";

export interface CreateProductReviewCommand extends ICommand {
  readonly productId: string;
  readonly userId: string;
  readonly rating: number;
  readonly title?: string;
  readonly body?: string;
}

export class CreateProductReviewHandler
  implements ICommandHandler<CreateProductReviewCommand, CommandResult<ReviewDTO>>
{
  constructor(private readonly reviewService: ProductReviewService) {}

  async handle(command: CreateProductReviewCommand): Promise<CommandResult<ReviewDTO>> {
    const dto = await this.reviewService.createReview({
      productId: command.productId,
      userId: command.userId,
      rating: command.rating,
      title: command.title,
      body: command.body,
    });
    return CommandResult.success(dto);
  }
}
