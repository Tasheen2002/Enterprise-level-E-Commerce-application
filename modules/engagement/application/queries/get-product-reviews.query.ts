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

export interface GetProductReviewsQuery extends IQuery {
  productId: string;
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

export class GetProductReviewsHandler
  implements IQueryHandler<GetProductReviewsQuery, QueryResult<ProductReviewDto[]>>
{
  constructor(
    private readonly reviewService: ProductReviewService
  ) {}

  async handle(
    query: GetProductReviewsQuery
  ): Promise<QueryResult<ProductReviewDto[]>> {
    try {
      if (!query.productId || query.productId.trim().length === 0) {
        return QueryResult.failure<ProductReviewDto[]>(
          "Product ID is required",
          ["productId"]
        );
      }

      const reviews = await this.reviewService.getReviewsByProduct(
        query.productId,
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
          "Failed to get product reviews",
          [error.message]
        );
      }

      return QueryResult.failure<ProductReviewDto[]>(
        "An unexpected error occurred while getting product reviews"
      );
    }
  }
}
