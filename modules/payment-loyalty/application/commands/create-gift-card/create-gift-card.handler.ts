import {
  GiftCardService,
  CreateGiftCardDto,
  GiftCardDto,
} from "../../services/gift-card.service";
import { ICommandHandler, CommandResult } from "@/api/src/shared/application";
import { CreateGiftCardCommand } from "./create-gift-card.command";

export class CreateGiftCardHandler implements ICommandHandler<
  CreateGiftCardCommand,
  CommandResult<GiftCardDto>
> {
  constructor(private readonly giftCardService: GiftCardService) {}

  async handle(
    command: CreateGiftCardCommand,
  ): Promise<CommandResult<GiftCardDto>> {
    try {
      const dto: CreateGiftCardDto = {
        code: command.code,
        initialBalance: command.initialBalance,
        currency: command.currency,
        expiresAt: command.expiresAt,
        recipientEmail: command.recipientEmail,
        recipientName: command.recipientName,
        message: command.message,
      };

      const giftCard = await this.giftCardService.createGiftCard(dto);

      return CommandResult.success<GiftCardDto>(giftCard);
    } catch (error) {
      return CommandResult.failure<GiftCardDto>(
        error instanceof Error
          ? error.message
          : "An unexpected error occurred while creating gift card",
        [error instanceof Error ? error.message : "Unknown error"],
      );
    }
  }
}
