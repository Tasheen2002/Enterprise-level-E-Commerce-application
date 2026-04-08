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

export interface GetWishlistQuery extends IQuery {
  wishlistId: string;
}

export interface WishlistDto {
  wishlistId: string;
  userId?: string;
  guestToken?: string;
  name?: string;
  isDefault: boolean;
  isPublic: boolean;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class GetWishlistHandler
  implements IQueryHandler<GetWishlistQuery, QueryResult<WishlistDto | null>>
{
  constructor(
    private readonly wishlistService: WishlistManagementService
  ) {}

  async handle(
    query: GetWishlistQuery
  ): Promise<QueryResult<WishlistDto | null>> {
    try {
      if (!query.wishlistId || query.wishlistId.trim().length === 0) {
        return QueryResult.failure<WishlistDto | null>(
          "Wishlist ID is required",
          ["wishlistId"]
        );
      }

      const wishlist = await this.wishlistService.getWishlist(query.wishlistId);

      if (!wishlist) {
        return QueryResult.success<WishlistDto | null>(null);
      }

      const result: WishlistDto = {
        wishlistId: wishlist.getWishlistId().getValue(),
        userId: wishlist.getUserId(),
        guestToken: wishlist.getGuestToken(),
        name: wishlist.getName(),
        isDefault: wishlist.getIsDefault(),
        isPublic: wishlist.getIsPublic(),
        description: wishlist.getDescription(),
        createdAt: wishlist.getCreatedAt(),
        updatedAt: wishlist.getUpdatedAt(),
      };

      return QueryResult.success<WishlistDto | null>(result);
    } catch (error) {
      if (error instanceof Error) {
        return QueryResult.failure<WishlistDto | null>(
          "Failed to get wishlist",
          [error.message]
        );
      }

      return QueryResult.failure<WishlistDto | null>(
        "An unexpected error occurred while getting wishlist"
      );
    }
  }
}
