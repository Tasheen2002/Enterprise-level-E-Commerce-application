import {
  ICommand,
  ICommandHandler,
  CommandResult,
} from '../../../../packages/core/src/application/cqrs';
import { PromotionService } from '../services/promotion.service';
import { PromotionDTO } from '../../domain/entities/promotion.entity';
import { PromotionRule } from '../../domain/entities/promotion.entity';

export interface CreatePromotionCommand extends ICommand {
  readonly code?: string;
  readonly rule: PromotionRule;
  readonly startsAt?: Date;
  readonly endsAt?: Date;
  readonly usageLimit?: number;
}

export class CreatePromotionHandler implements ICommandHandler<
  CreatePromotionCommand,
  CommandResult<PromotionDTO>
> {
  constructor(private readonly promotionService: PromotionService) {}

  async handle(command: CreatePromotionCommand): Promise<CommandResult<PromotionDTO>> {
    const promotion = await this.promotionService.createPromotion({
      code: command.code,
      rule: command.rule,
      startsAt: command.startsAt,
      endsAt: command.endsAt,
      usageLimit: command.usageLimit,
    });
    return CommandResult.success(promotion);
  }
}
