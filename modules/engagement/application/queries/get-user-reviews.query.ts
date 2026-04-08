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

export interface GetUserReviewsQuery extends IQuery {
  userId: string;
  limit?: number;
  offset?: number;
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

export class GetUserReviewsHandler
  implements IQueryHandler<GetUserReviewsQuery, QueryResult<ProductReviewDto[]>>
{
  constructor(
    private readonly reviewService: ProductReviewService
  ) {}

  async handle(
    query: GetUserReviewsQuery
  ): Promise<QueryResult<ProductReviewDto[]>> {
    try {
      if (!query.userId || query.userId.trim().length === 0) {
        return QueryResult.failure<ProductReviewDto[]>(
          "User ID is required",
          ["userId"]
        );
      }

      const reviews = await this.reviewService.getReviewsByUser(
        query.userId,
        {
          limit: query.limit,
          offset: query.offset,
        }
      );

      const result: ProductReviewDto[] = reviews.map((review) => ({
        reviewId: review.getReviewId().getValue(),
        productId: review.getProductId(),
        userId: review.getUserId(),
        rating: review.getRating().getValue(),
        title: review.getTitle(),
        body: review.getBody(),
        status: review.getStatus().getValue(),
        createdAt: review.getCreatedAt(),
      }));

      return QueryResult.success<ProductReviewDto[]>(result);
    } catch (error) {
      if (error instanceof Error) {
        return QueryResult.failure<ProductReviewDto[]>(
          "Failed to get user reviews",
          [error.message]
        );
      }

      return QueryResult.failure<ProductReviewDto[]>(
        "An unexpected error occurred while getting user reviews"
      );
    }
  }
}
