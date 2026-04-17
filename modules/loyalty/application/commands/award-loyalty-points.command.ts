import {
  ICommand,
  ICommandHandler,
  CommandResult,
} from '../../../../packages/core/src/application/cqrs';
import { LoyaltyService, LoyaltyAccountData } from '../services/loyalty.service';
import { LoyaltyTransactionReason } from '../../domain/enums/loyalty.enums';

export interface AwardLoyaltyPointsCommand extends ICommand {
  readonly userId: string;
  readonly points: number;
  readonly reason: LoyaltyTransactionReason;
  readonly orderId?: string;
  readonly description?: string;
}

export class AwardLoyaltyPointsHandler implements ICommandHandler<
  AwardLoyaltyPointsCommand,
  CommandResult<LoyaltyAccountData>
> {
  constructor(private readonly loyaltyService: LoyaltyService) {}

  async handle(command: AwardLoyaltyPointsCommand): Promise<CommandResult<LoyaltyAccountData>> {
    await this.loyaltyService.earnPoints({
      userId: command.userId,
      points: command.points,
      reason: command.reason,
      orderId: command.orderId,
      description: command.description,
    });
    const account = await this.loyaltyService.getAccountDetails(command.userId);
    return CommandResult.success(account);
  }
}
