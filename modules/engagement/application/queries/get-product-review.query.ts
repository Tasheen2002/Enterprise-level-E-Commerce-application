import { IQuery, IQueryHandler } from "../../../../packages/core/src/application/cqrs";
import { ProductReviewService } from "../services/product-review.service";
import { ReviewDTO } from "../../domain/entities/product-review.entity";
import { ProductReviewNotFoundError } from "../../domain/errors/engagement.errors";

export interface GetProductReviewQuery extends IQuery {
  readonly reviewId: string;
  /** Unapproved reviews are visible only to their author and staff. */
  readonly viewer: { userId?: string; isStaff: boolean };
}

export class GetProductReviewHandler implements IQueryHandler<GetProductReviewQuery, ReviewDTO> {
  constructor(private readonly productReviewService: ProductReviewService) {}

  async handle(query: GetProductReviewQuery): Promise<ReviewDTO> {
    const dto = await this.productReviewService.getReviewById(query.reviewId);
    const visible =
      dto &&
      (dto.status === "approved" || query.viewer.isStaff || query.viewer.userId === dto.userId);
    if (!dto || !visible) {
      throw new ProductReviewNotFoundError(query.reviewId);
    }
    return dto;
  }
}