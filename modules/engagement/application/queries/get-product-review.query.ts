import { ProductReviewService } from "../services/product-review.service.js";

export interface IQuery {
  readonly queryId?: string;
  readonly timestamp?: Date;
}

export interface IQueryHandler<TQuery extends IQuery, TResult = void> {
  handle(query: TQuery): Promise<TResult>;
}

export class QueryResult<T = any> {
  constructor(
    public success: boolean,
    public data?: T,
    public error?: string,
    public errors?: string[]
  ) {}

  static success<T>(data?: T): QueryResult<T> {
    return new QueryResult(true, data);
  }

  static failure<T>(error: string, errors?: string[]): QueryResult<T> {
    return new QueryResult<T>(false, undefined, error, errors);
  }
}

export interface GetProductReviewQuery extends IQuery {
  reviewId: string;
}

export interface ProductReviewDto {
  reviewId: string;
  productId: string;
  userId: string;
  rating: number;
  title?: string;
  body?: string;
  status: string;
  createdAt: Date;
}

export class GetProductReviewHandler
  implements IQueryHandler<GetProductReviewQuery, QueryResult<ProductReviewDto | null>>
{
  constructor(
    private readonly reviewService: ProductReviewService
  ) {}

  async handle(
    query: GetProductReviewQuery
  ): Promise<QueryResult<ProductReviewDto | null>> {
    try {
      if (!query.reviewId || query.reviewId.trim().length === 0) {
        return QueryResult.failure<ProductReviewDto | null>(
          "Review ID is required",
          ["reviewId"]
        );
      }

      const review = await this.reviewService.getReview(query.reviewId);

      if (!review) {
        return QueryResult.success<ProductReviewDto | null>(null);
      }

      const result: ProductReviewDto = {
        reviewId: review.getReviewId().getValue(),
        productId: review.getProductId(),
        userId: review.getUserId(),
        rating: review.getRating().getValue(),
        title: review.getTitle(),
        body: review.getBody(),
        status: review.getStatus().getValue(),
        createdAt: review.getCreatedAt(),
      };

      return QueryResult.success<ProductReviewDto | null>(result);
    } catch (error) {
      if (error instanceof Error) {
        return QueryResult.failure<ProductReviewDto | null>(
          "Failed to get product review",
          [error.message]
        );
      }

      return QueryResult.failure<ProductReviewDto | null>(
        "An unexpected error occurred while getting product review"
      );
    }
  }
}