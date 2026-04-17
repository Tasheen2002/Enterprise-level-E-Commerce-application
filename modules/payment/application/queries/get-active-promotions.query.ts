import {
  IQuery,
  IQueryHandler,
} from '../../../../packages/core/src/application/cqrs';
import { PromotionService, PromotionDto } from '../services/promotion.service';

export interface GetActivePromotionsQuery extends IQuery {}

export class GetActivePromotionsHandler implements IQueryHandler<
  GetActivePromotionsQuery,
  PromotionDto[]
> {
  constructor(private readonly promotionService: PromotionService) {}

  async handle(): Promise<PromotionDto[]> {
    return this.promotionService.getActivePromotions();
  }
}
