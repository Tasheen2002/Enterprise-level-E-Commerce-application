import { IQuery, IQueryHandler } from "../../../../packages/core/src/application/cqrs";
import { ProductReviewService, PaginatedReviewResult } from "../services/product-review.service";

export interface GetProductReviewsQuery extends IQuery {
  readonly productId: string;
  readonly limit?: number;
  readonly offset?: number;
}

export class GetProductReviewsHandler implements IQueryHandler<GetProductReviewsQuery, PaginatedReviewResult> {
  constructor(private readonly productReviewService: ProductReviewService) {}

  async handle(query: GetProductReviewsQuery): Promise<PaginatedReviewResult> {
    return this.productReviewService.getReviewsByProduct(
      query.productId,
      {
        limit: query.limit,
        offset: query.offset,
      }
    );
  }
}
