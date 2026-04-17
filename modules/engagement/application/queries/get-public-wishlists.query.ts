import { IQuery, IQueryHandler } from "../../../../packages/core/src/application/cqrs";
import { WishlistManagementService, PaginatedWishlistResult } from "../services/wishlist-management.service";

export interface GetPublicWishlistsQuery extends IQuery {
  readonly limit?: number;
  readonly offset?: number;
}

export class GetPublicWishlistsHandler implements IQueryHandler<GetPublicWishlistsQuery, PaginatedWishlistResult> {
  constructor(private readonly wishlistService: WishlistManagementService) {}

  async handle(query: GetPublicWishlistsQuery): Promise<PaginatedWishlistResult> {
    return this.wishlistService.getPublicWishlists({
      limit: query.limit,
      offset: query.offset,
    });
  }
}
