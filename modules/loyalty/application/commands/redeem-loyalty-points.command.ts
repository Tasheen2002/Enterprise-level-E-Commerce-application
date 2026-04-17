import {
  ICommand,
  ICommandHandler,
  CommandResult,
} from '../../../../packages/core/src/application/cqrs';
import { LoyaltyService, LoyaltyAccountData } from '../services/loyalty.service';
import { LoyaltyTransactionReason } from '../../domain/enums/loyalty.enums';

export interface RedeemLoyaltyPointsCommand extends ICommand {
  readonly userId: string;
  readonly points: number;
  readonly orderId: string;
  readonly reason?: LoyaltyTransactionReason;
}

export class RedeemLoyaltyPointsHandler implements ICommandHandler<
  RedeemLoyaltyPointsCommand,
  CommandResult<LoyaltyAccountData>
> {
  constructor(private readonly loyaltyService: LoyaltyService) {}

  async handle(command: RedeemLoyaltyPointsCommand): Promise<CommandResult<LoyaltyAccountData>> {
    await this.loyaltyService.redeemPoints({
      userId: command.userId,
      points: command.points,
      reason: command.reason ?? LoyaltyTransactionReason.DISCOUNT_REDEMPTION,
      referenceId: command.orderId,
    });
    const account = await this.loyaltyService.getAccountDetails(command.userId);
    return CommandResult.success(account);
  }
}
