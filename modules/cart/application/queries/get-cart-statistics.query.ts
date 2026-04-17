import { IQuery, IQueryHandler } from "../../../../packages/core/src/application/cqrs";
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

export class GetCartStatisticsHandler implements IQueryHandler<GetCartStatisticsQuery, CartStatisticsDto> {
  constructor(private readonly cartManagementService: CartManagementService) {}

  async handle(): Promise<CartStatisticsDto> {
    return this.cartManagementService.getCartStatistics();
  }
}
