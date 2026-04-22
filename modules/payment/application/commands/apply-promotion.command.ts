import {
  ICommand,
  ICommandHandler,
  CommandResult,
} from '../../../../packages/core/src/application/cqrs';
import { PromotionService, ApplyPromotionResult } from '../services/promotion.service';

export interface ApplyPromotionCommand extends ICommand {
  readonly promoCode: string;
  readonly orderId?: string;
  readonly orderAmount: number;
  readonly currency?: string;
  readonly products?: string[];
  readonly categories?: string[];
}

export class ApplyPromotionHandler implements ICommandHandler<
  ApplyPromotionCommand,
  CommandResult<ApplyPromotionResult>
> {
  constructor(private readonly promotionService: PromotionService) {}

  async handle(command: ApplyPromotionCommand): Promise<CommandResult<ApplyPromotionResult>> {
    const result = await this.promotionService.applyPromotion({
      promoCode: command.promoCode,
      orderId: command.orderId,
      orderAmount: command.orderAmount,
      currency: command.currency,
      products: command.products,
      categories: command.categories,
    });

    if (!result.valid) {
      return CommandResult.failure(result.error || 'Promotion is not valid');
    }

    return CommandResult.success(result);
  }
}
