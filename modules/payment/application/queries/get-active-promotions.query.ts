import {
  IQuery,
  IQueryHandler,
} from '../../../../packages/core/src/application/cqrs';
import { PromotionService } from '../services/promotion.service';
import { PromotionDTO } from '../../domain/entities/promotion.entity';

export interface GetActivePromotionsQuery extends IQuery {}

export class GetActivePromotionsHandler implements IQueryHandler<
  GetActivePromotionsQuery,
  PromotionDTO[]
> {
  constructor(private readonly promotionService: PromotionService) {}

  async handle(): Promise<PromotionDTO[]> {
    return this.promotionService.getActivePromotions();
  }
}
