import {
  ICommand,
  ICommandHandler,
  CommandResult,
} from '../../../../packages/core/src/application/cqrs';
import { LoyaltyService } from '../services/loyalty.service';
import { LoyaltyTransactionDTO } from '../../domain/entities/loyalty-transaction.entity';
import { LoyaltyTransactionReasonValue } from '../../domain/value-objects/loyalty-reason.vo';

export interface RedeemLoyaltyPointsCommand extends ICommand {
  readonly userId: string;
  readonly points: number;
  readonly orderId?: string;
  readonly reason?: LoyaltyTransactionReasonValue;
  readonly description?: string;
}

export class RedeemLoyaltyPointsHandler implements ICommandHandler<
  RedeemLoyaltyPointsCommand,
  CommandResult<LoyaltyTransactionDTO>
> {
  constructor(private readonly loyaltyService: LoyaltyService) {}

  async handle(command: RedeemLoyaltyPointsCommand): Promise<CommandResult<LoyaltyTransactionDTO>> {
    const transaction = await this.loyaltyService.redeemPoints({
      userId: command.userId,
      points: command.points,
      reason: command.reason ?? LoyaltyTransactionReasonValue.DISCOUNT_REDEMPTION,
      orderId: command.orderId,
      description: command.description,
    });
    return CommandResult.success(transaction);
  }
}
