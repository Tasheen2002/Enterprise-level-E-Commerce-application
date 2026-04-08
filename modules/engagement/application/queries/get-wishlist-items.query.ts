import { WishlistManagementService } from "../services/wishlist-management.service.js";

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

export interface GetWishlistItemsQuery extends IQuery {
  wishlistId: string;
  limit?: number;
  offset?: number;
}

export interface WishlistItemDto {
  wishlistId: string;
  variantId: string;
}

export class GetWishlistItemsHandler
  implements IQueryHandler<GetWishlistItemsQuery, QueryResult<WishlistItemDto[]>>
{
  constructor(
    private readonly wishlistService: WishlistManagementService
  ) {}

  async handle(
    query: GetWishlistItemsQuery
  ): Promise<QueryResult<WishlistItemDto[]>> {
    try {
      if (!query.wishlistId || query.wishlistId.trim().length === 0) {
        return QueryResult.failure<WishlistItemDto[]>(
          "Wishlist ID is required",
          ["wishlistId"]
        );
      }

      const items = await this.wishlistService.getWishlistItems(
        query.wishlistId,
        {
          limit: query.limit,
          offset: query.offset,
        }
      );

      const result: WishlistItemDto[] = items.map((item) => ({
        wishlistId: item.getWishlistId(),
        variantId: item.getVariantId(),
      }));

      return QueryResult.success<WishlistItemDto[]>(result);
    } catch (error) {
      if (error instanceof Error) {
        return QueryResult.failure<WishlistItemDto[]>(
          "Failed to get wishlist items",
          [error.message]
        );
      }

      return QueryResult.failure<WishlistItemDto[]>(
        "An unexpected error occurred while getting wishlist items"
      );
    }
  }
}
