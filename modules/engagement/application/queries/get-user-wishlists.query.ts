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

export interface GetUserWishlistsQuery extends IQuery {
  userId: string;
  limit?: number;
  offset?: number;
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

export class GetUserWishlistsHandler
  implements IQueryHandler<GetUserWishlistsQuery, QueryResult<WishlistDto[]>>
{
  constructor(
    private readonly wishlistService: WishlistManagementService
  ) {}

  async handle(
    query: GetUserWishlistsQuery
  ): Promise<QueryResult<WishlistDto[]>> {
    try {
      if (!query.userId || query.userId.trim().length === 0) {
        return QueryResult.failure<WishlistDto[]>(
          "User ID is required",
          ["userId"]
        );
      }

      const wishlists = await this.wishlistService.getWishlistsByUser(
        query.userId,
        {
          limit: query.limit,
          offset: query.offset,
        }
      );

      const result: WishlistDto[] = wishlists.map((wishlist) => ({
        wishlistId: wishlist.getWishlistId().getValue(),
        userId: wishlist.getUserId(),
        guestToken: wishlist.getGuestToken(),
        name: wishlist.getName(),
        isDefault: wishlist.getIsDefault(),
        isPublic: wishlist.getIsPublic(),
        description: wishlist.getDescription(),
        createdAt: wishlist.getCreatedAt(),
        updatedAt: wishlist.getUpdatedAt(),
      }));

      return QueryResult.success<WishlistDto[]>(result);
    } catch (error) {
      if (error instanceof Error) {
        return QueryResult.failure<WishlistDto[]>(
          "Failed to get user wishlists",
          [error.message]
        );
      }

      return QueryResult.failure<WishlistDto[]>(
        "An unexpected error occurred while getting user wishlists"
      );
    }
  }
}
