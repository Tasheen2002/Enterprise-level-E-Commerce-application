import { IQuery, IQueryHandler } from "../../../../packages/core/src/application/cqrs";
import { WishlistManagementService } from "../services/wishlist-management.service";
import { WishlistDTO } from "../../domain/entities/wishlist.entity";
import { WishlistNotFoundError } from "../../domain/errors/engagement.errors";

export interface GetWishlistQuery extends IQuery {
  readonly wishlistId: string;
}

export class GetWishlistHandler implements IQueryHandler<GetWishlistQuery, WishlistDTO> {
  constructor(private readonly wishlistService: WishlistManagementService) {}

  async handle(query: GetWishlistQuery): Promise<WishlistDTO> {
    const dto = await this.wishlistService.getWishlistById(query.wishlistId);
    if (!dto) {
      throw new WishlistNotFoundError(query.wishlistId);
    }
    return dto;
  }
}
