import { IQuery, IQueryHandler } from "../../../../packages/core/src/application/cqrs";
import { WishlistManagementService, PaginatedWishlistItemResult } from "../services/wishlist-management.service";

export interface GetWishlistItemsQuery extends IQuery {
  readonly wishlistId: string;
  readonly limit?: number;
  readonly offset?: number;
}

export class GetWishlistItemsHandler implements IQueryHandler<GetWishlistItemsQuery, PaginatedWishlistItemResult> {
  constructor(private readonly wishlistService: WishlistManagementService) {}

  async handle(query: GetWishlistItemsQuery): Promise<PaginatedWishlistItemResult> {
    return this.wishlistService.getWishlistItems(
      query.wishlistId,
      {
        limit: query.limit,
        offset: query.offset,
      }
    );
  }
}
