import { IQuery, IQueryHandler } from "../../../../packages/core/src/application/cqrs";
import { ProductReviewService } from "../services/product-review.service";
import { ReviewDTO } from "../../domain/entities/product-review.entity";
import { ProductReviewNotFoundError } from "../../domain/errors/engagement.errors";

export interface GetProductReviewQuery extends IQuery {
  readonly reviewId: string;
}

export class GetProductReviewHandler implements IQueryHandler<GetProductReviewQuery, ReviewDTO> {
  constructor(private readonly productReviewService: ProductReviewService) {}

  async handle(query: GetProductReviewQuery): Promise<ReviewDTO> {
    const dto = await this.productReviewService.getReviewById(query.reviewId);
    if (!dto) {
      throw new ProductReviewNotFoundError(query.reviewId);
    }
    return dto;
  }
}