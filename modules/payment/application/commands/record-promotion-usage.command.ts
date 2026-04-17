import {
  ICommand,
  ICommandHandler,
  CommandResult,
} from '../../../../packages/core/src/application/cqrs';
import { PromotionService, PromotionUsageDto } from '../services/promotion.service';

export interface RecordPromotionUsageCommand extends ICommand {
  readonly promoId: string;
  readonly orderId: string;
  readonly discountAmount: number;
  readonly currency?: string;
}

export class RecordPromotionUsageHandler implements ICommandHandler<
  RecordPromotionUsageCommand,
  CommandResult<PromotionUsageDto>
> {
  constructor(private readonly promotionService: PromotionService) {}

  async handle(command: RecordPromotionUsageCommand): Promise<CommandResult<PromotionUsageDto>> {
    const usage = await this.promotionService.recordPromotionUsage({
      promoId: command.promoId,
      orderId: command.orderId,
      discountAmount: command.discountAmount,
      currency: command.currency,
    });
    return CommandResult.success(usage);
  }
}
