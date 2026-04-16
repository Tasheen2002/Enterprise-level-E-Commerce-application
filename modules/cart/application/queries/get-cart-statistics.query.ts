import { IQuery, IQueryHandler, QueryResult } from "../../../../packages/core/src/application/cqrs";
import { CartManagementService } from "../services/cart-management.service";

export interface CartStatisticsDto {
  readonly totalCarts: number;
  readonly userCarts: number;
  readonly guestCarts: number;
  readonly emptyCarts: number;
  readonly averageItemsPerCart: number;
  readonly averageCartValue: number;
}

export interface GetCartStatisticsQuery extends IQuery {}

export class GetCartStatisticsHandler implements IQueryHandler<GetCartStatisticsQuery, QueryResult<CartStatisticsDto>> {
  constructor(private readonly cartManagementService: CartManagementService) {}

  async handle(_query: GetCartStatisticsQuery): Promise<QueryResult<CartStatisticsDto>> {
    const statistics = await this.cartManagementService.getCartStatistics();
    return QueryResult.success<CartStatisticsDto>(statistics);
  }
}
