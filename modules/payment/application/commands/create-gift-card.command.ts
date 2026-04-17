import {
  ICommand,
  ICommandHandler,
  CommandResult,
} from '../../../../packages/core/src/application/cqrs';
import { GiftCardService, GiftCardDto } from '../services/gift-card.service';

export interface CreateGiftCardCommand extends ICommand {
  readonly code: string;
  readonly initialBalance: number;
  readonly currency?: string;
  readonly expiresAt?: Date;
  readonly recipientEmail?: string;
  readonly recipientName?: string;
  readonly message?: string;
}

export class CreateGiftCardHandler implements ICommandHandler<
  CreateGiftCardCommand,
  CommandResult<GiftCardDto>
> {
  constructor(private readonly giftCardService: GiftCardService) {}

  async handle(command: CreateGiftCardCommand): Promise<CommandResult<GiftCardDto>> {
    const giftCard = await this.giftCardService.createGiftCard({
      code: command.code,
      initialBalance: command.initialBalance,
      currency: command.currency,
      expiresAt: command.expiresAt,
      recipientEmail: command.recipientEmail,
      recipientName: command.recipientName,
      message: command.message,
    });
    return CommandResult.success(giftCard);
  }
}
