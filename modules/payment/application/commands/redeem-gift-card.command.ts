import {
  ICommand,
  ICommandHandler,
  CommandResult,
} from '../../../../packages/core/src/application/cqrs';
import { GiftCardService } from '../services/gift-card.service';
import { GiftCardDTO } from '../../domain/entities/gift-card.entity';

export interface RedeemGiftCardCommand extends ICommand {
  readonly giftCardId: string;
  readonly amount: number;
  readonly orderId: string;
  readonly userId?: string;
}

export class RedeemGiftCardHandler implements ICommandHandler<
  RedeemGiftCardCommand,
  CommandResult<GiftCardDTO>
> {
  constructor(private readonly giftCardService: GiftCardService) {}

  async handle(command: RedeemGiftCardCommand): Promise<CommandResult<GiftCardDTO>> {
    const giftCard = await this.giftCardService.redeemGiftCard({
      giftCardId: command.giftCardId,
      amount: command.amount,
      orderId: command.orderId,
      userId: command.userId,
    });
    return CommandResult.success(giftCard);
  }
}
