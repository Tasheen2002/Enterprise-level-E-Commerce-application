import { IQuery, IQueryHandler } from "../../../../packages/core/src/application/cqrs";
import { WishlistManagementService, PaginatedWishlistResult } from "../services/wishlist-management.service";

export interface GetUserWishlistsQuery extends IQuery {
  readonly userId: string;
  readonly limit?: number;
  readonly offset?: number;
}

export class GetUserWishlistsHandler implements IQueryHandler<GetUserWishlistsQuery, PaginatedWishlistResult> {
  constructor(private readonly wishlistService: WishlistManagementService) {}

  async handle(query: GetUserWishlistsQuery): Promise<PaginatedWishlistResult> {
    return this.wishlistService.getWishlistsByUser(
      query.userId,
      {
        limit: query.limit,
        offset: query.offset,
      }
    );
  }
}
