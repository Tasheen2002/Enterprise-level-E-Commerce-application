import {
  PromotionService,
  ApplyPromotionDto,
  ApplyPromotionResult,
} from "../services/promotion.service";
import { ICommandHandler, CommandResult } from "@/api/src/shared/application";
import { ApplyPromotionCommand } from "./apply-promotion.command";

export class ApplyPromotionHandler implements ICommandHandler<
  ApplyPromotionCommand,
  CommandResult<ApplyPromotionResult>
> {
  constructor(private readonly promotionService: PromotionService) {}

  async handle(
    command: ApplyPromotionCommand,
  ): Promise<CommandResult<ApplyPromotionResult>> {
    try {
      const dto: ApplyPromotionDto = {
        promoCode: command.promoCode,
        orderId: command.orderId,
        orderAmount: command.orderAmount,
        currency: command.currency,
        products: command.products,
        categories: command.categories,
      };

      const result = await this.promotionService.applyPromotion(dto);

      if (!result.valid) {
        return CommandResult.failure<ApplyPromotionResult>(
          result.error || "Promotion is not valid",
          ["promoCode"],
        );
      }

      return CommandResult.success<ApplyPromotionResult>(result);
    } catch (error) {
      return CommandResult.failure<ApplyPromotionResult>(
        error instanceof Error
          ? error.message
          : "An unexpected error occurred while applying promotion",
        [error instanceof Error ? error.message : "Unknown error"],
      );
    }
  }
}
