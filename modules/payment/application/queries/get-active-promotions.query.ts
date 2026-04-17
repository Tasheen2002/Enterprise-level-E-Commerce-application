import {
  IQuery,
  IQueryHandler,
  QueryResult,
} from '../../../../packages/core/src/application/cqrs';
import { PromotionService, PromotionDto } from '../services/promotion.service';

export interface GetActivePromotionsQuery extends IQuery {}

export class GetActivePromotionsHandler implements IQueryHandler<
  GetActivePromotionsQuery,
  QueryResult<PromotionDto[]>
> {
  constructor(private readonly promotionService: PromotionService) {}

  async handle(_query: GetActivePromotionsQuery): Promise<QueryResult<PromotionDto[]>> {
    const promotions = await this.promotionService.getActivePromotions();
    return QueryResult.success(promotions);
  }
}
