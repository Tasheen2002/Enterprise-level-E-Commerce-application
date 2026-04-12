import { IQuery, IQueryHandler, QueryResult } from "../../../../packages/core/src/application/cqrs";
import { CartManagementService } from "../services/cart-management.service";

export interface CartStatisticsDto {
  totalCarts: number;
  userCarts: number;
  guestCarts: number;
  emptyCarts: number;
  averageItemsPerCart: number;
  averageCartValue: number;
}

export interface GetCartStatisticsQuery extends IQuery {}

export class GetCartStatisticsHandler implements IQueryHandler<GetCartStatisticsQuery, QueryResult<CartStatisticsDto>> {
  constructor(private readonly cartManagementService: CartManagementService) {}

  async handle(_query: GetCartStatisticsQuery): Promise<QueryResult<CartStatisticsDto>> {
    const statistics = await this.cartManagementService.getCartStatistics();
    return QueryResult.success<CartStatisticsDto>(statistics);
  }
}
