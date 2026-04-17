import {
  IQuery,
  IQueryHandler,
} from '../../../../packages/core/src/application/cqrs';
import { PromotionService } from '../services/promotion.service';
import { PromotionUsageDTO } from '../../domain/entities/promotion-usage.entity';

export interface GetPromotionUsageQuery extends IQuery {
  readonly promoId: string;
}

export class GetPromotionUsageHandler implements IQueryHandler<
  GetPromotionUsageQuery,
  PromotionUsageDTO[]
> {
  constructor(private readonly promotionService: PromotionService) {}

  async handle(query: GetPromotionUsageQuery): Promise<PromotionUsageDTO[]> {
    return this.promotionService.getPromotionUsage(query.promoId);
  }
}
