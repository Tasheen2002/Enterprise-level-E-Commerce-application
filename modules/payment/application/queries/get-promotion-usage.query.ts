import {
  IQuery,
  IQueryHandler,
  QueryResult,
} from '../../../../packages/core/src/application/cqrs';
import { PromotionService, PromotionUsageDto } from '../services/promotion.service';

export interface GetPromotionUsageQuery extends IQuery {
  readonly promoId: string;
}

export class GetPromotionUsageHandler implements IQueryHandler<
  GetPromotionUsageQuery,
  QueryResult<PromotionUsageDto[]>
> {
  constructor(private readonly promotionService: PromotionService) {}

  async handle(query: GetPromotionUsageQuery): Promise<QueryResult<PromotionUsageDto[]>> {
    const usage = await this.promotionService.getPromotionUsage(query.promoId);
    return QueryResult.success(usage);
  }
}
