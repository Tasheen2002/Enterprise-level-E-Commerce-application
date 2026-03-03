import {
  PromotionService,
  CreatePromotionDto,
  PromotionDto,
} from "../services/promotion.service";
import { ICommandHandler, CommandResult } from "@/api/src/shared/application";
import { CreatePromotionCommand } from "./create-promotion.command";

export class CreatePromotionHandler implements ICommandHandler<
  CreatePromotionCommand,
  CommandResult<PromotionDto>
> {
  constructor(private readonly promotionService: PromotionService) {}

  async handle(
    command: CreatePromotionCommand,
  ): Promise<CommandResult<PromotionDto>> {
    try {
      const dto: CreatePromotionDto = {
        code: command.code,
        rule: command.rule,
        startsAt: command.startsAt,
        endsAt: command.endsAt,
        usageLimit: command.usageLimit,
      };

      const promotion = await this.promotionService.createPromotion(dto);

      return CommandResult.success<PromotionDto>(promotion);
    } catch (error) {
      return CommandResult.failure<PromotionDto>(
        error instanceof Error
          ? error.message
          : "An unexpected error occurred while creating promotion",
        [error instanceof Error ? error.message : "Unknown error"],
      );
    }
  }
}
