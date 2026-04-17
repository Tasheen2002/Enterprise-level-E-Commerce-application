import { IQuery, IQueryHandler } from "../../../../packages/core/src/application/cqrs";
import { ProductReviewService, PaginatedReviewResult } from "../services/product-review.service";

export interface GetUserReviewsQuery extends IQuery {
  readonly userId: string;
  readonly limit?: number;
  readonly offset?: number;
}

export class GetUserReviewsHandler implements IQueryHandler<GetUserReviewsQuery, PaginatedReviewResult> {
  constructor(private readonly productReviewService: ProductReviewService) {}

  async handle(query: GetUserReviewsQuery): Promise<PaginatedReviewResult> {
    return this.productReviewService.getReviewsByUser(
      query.userId,
      {
        limit: query.limit,
        offset: query.offset,
      }
    );
  }
}
