import {
  ICommand,
  ICommandHandler,
  CommandResult,
} from '../../../../packages/core/src/application/cqrs';
import { LoyaltyService } from '../services/loyalty.service';
import { LoyaltyTransaction, LoyaltyTransactionDTO } from '../../domain/entities/loyalty-transaction.entity';

export interface AdjustPointsCommand extends ICommand {
  readonly userId: string;
  readonly points: number;
  readonly isAddition: boolean;
  readonly reason: string;
  readonly createdBy: string;
}

export class AdjustPointsHandler implements ICommandHandler<
  AdjustPointsCommand,
  CommandResult<LoyaltyTransactionDTO>
> {
  constructor(private readonly loyaltyService: LoyaltyService) {}

  async handle(command: AdjustPointsCommand): Promise<CommandResult<LoyaltyTransactionDTO>> {
    const transaction = await this.loyaltyService.adjustPoints({
      userId: command.userId,
      points: command.points,
      isAddition: command.isAddition,
      reason: command.reason,
      createdBy: command.createdBy,
    });
    return CommandResult.success(LoyaltyTransaction.toDTO(transaction));
  }
}
