import {
  PromotionService,
  RecordPromotionUsageDto,
  PromotionUsageDto,
} from "../../services/promotion.service";
import { ICommandHandler, CommandResult } from "@/api/src/shared/application";
import { RecordPromotionUsageCommand } from "./record-promotion-usage.command";

export class RecordPromotionUsageHandler implements ICommandHandler<
  RecordPromotionUsageCommand,
  CommandResult<PromotionUsageDto>
> {
  constructor(private readonly promotionService: PromotionService) {}

  async handle(
    command: RecordPromotionUsageCommand,
  ): Promise<CommandResult<PromotionUsageDto>> {
    try {
      const dto: RecordPromotionUsageDto = {
        promoId: command.promoId,
        orderId: command.orderId,
        discountAmount: command.discountAmount,
        currency: command.currency,
      };

      const usage = await this.promotionService.recordPromotionUsage(dto);
      return CommandResult.success<PromotionUsageDto>(usage);
    } catch (error) {
      return CommandResult.failure<PromotionUsageDto>(
        error instanceof Error
          ? error.message
          : "An unexpected error occurred while recording promotion usage",
        [error instanceof Error ? error.message : "Unknown error"],
      );
    }
  }
}
