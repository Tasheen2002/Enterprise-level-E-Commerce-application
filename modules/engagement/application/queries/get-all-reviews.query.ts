import { IQuery, IQueryHandler } from "../../../../packages/core/src/application/cqrs";
import { ProductReviewService, PaginatedReviewResult } from "../services/product-review.service";

export interface GetAllReviewsQuery extends IQuery {
  readonly limit?: number;
  readonly offset?: number;
  readonly status?: string;
}

export class GetAllReviewsHandler implements IQueryHandler<GetAllReviewsQuery, PaginatedReviewResult> {
  constructor(private readonly productReviewService: ProductReviewService) {}

  async handle(query: GetAllReviewsQuery): Promise<PaginatedReviewResult> {
    if (query.status) {
      return this.productReviewService.getReviewsWithFilters(
        { status: query.status as any },
        { limit: query.limit, offset: query.offset }
      );
    }
    return this.productReviewService.getAllReviews({
      limit: query.limit,
      offset: query.offset,
    });
  }
}
