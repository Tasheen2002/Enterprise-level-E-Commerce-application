import {
  GiftCardService,
  RedeemGiftCardDto,
  GiftCardDto,
} from "../services/gift-card.service";
import { ICommandHandler, CommandResult } from "@/api/src/shared/application";
import { RedeemGiftCardCommand } from "./redeem-gift-card.command";

export class RedeemGiftCardHandler implements ICommandHandler<
  RedeemGiftCardCommand,
  CommandResult<GiftCardDto>
> {
  constructor(private readonly giftCardService: GiftCardService) {}

  async handle(
    command: RedeemGiftCardCommand,
  ): Promise<CommandResult<GiftCardDto>> {
    try {
      const dto: RedeemGiftCardDto = {
        giftCardId: command.giftCardId,
        amount: command.amount,
        orderId: command.orderId,
        userId: command.userId,
      };

      const giftCard = await this.giftCardService.redeemGiftCard(dto);

      return CommandResult.success<GiftCardDto>(giftCard);
    } catch (error) {
      return CommandResult.failure<GiftCardDto>(
        error instanceof Error
          ? error.message
          : "An unexpected error occurred while redeeming gift card",
        [error instanceof Error ? error.message : "Unknown error"],
      );
    }
  }
}
