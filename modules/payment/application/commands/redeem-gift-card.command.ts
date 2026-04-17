import {
  ICommand,
  ICommandHandler,
  CommandResult,
} from '../../../../packages/core/src/application/cqrs';
import { GiftCardService, GiftCardDto } from '../services/gift-card.service';

export interface RedeemGiftCardCommand extends ICommand {
  readonly giftCardId: string;
  readonly amount: number;
  readonly orderId: string;
  readonly userId?: string;
}

export class RedeemGiftCardHandler implements ICommandHandler<
  RedeemGiftCardCommand,
  CommandResult<GiftCardDto>
> {
  constructor(private readonly giftCardService: GiftCardService) {}

  async handle(command: RedeemGiftCardCommand): Promise<CommandResult<GiftCardDto>> {
    const giftCard = await this.giftCardService.redeemGiftCard({
      giftCardId: command.giftCardId,
      amount: command.amount,
      orderId: command.orderId,
      userId: command.userId,
    });
    return CommandResult.success(giftCard);
  }
}
