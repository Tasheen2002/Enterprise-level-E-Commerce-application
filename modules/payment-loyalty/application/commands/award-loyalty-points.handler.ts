import {
  LoyaltyService,
  AwardPointsDto,
  LoyaltyAccountDto,
} from "../services/loyalty.service";
import { ICommandHandler, CommandResult } from "@/api/src/shared/application";
import { AwardLoyaltyPointsCommand } from "./award-loyalty-points.command";

export class AwardLoyaltyPointsHandler implements ICommandHandler<
  AwardLoyaltyPointsCommand,
  CommandResult<LoyaltyAccountDto>
> {
  constructor(private readonly loyaltyService: LoyaltyService) {}

  async handle(
    command: AwardLoyaltyPointsCommand,
  ): Promise<CommandResult<LoyaltyAccountDto>> {
    try {
      const dto: AwardPointsDto = {
        userId: command.userId,
        programId: command.programId,
        points: command.points,
        reason: command.reason,
        orderId: command.orderId,
      };

      const account = await this.loyaltyService.awardPoints(dto);

      return CommandResult.success<LoyaltyAccountDto>(account);
    } catch (error) {
      return CommandResult.failure<LoyaltyAccountDto>(
        error instanceof Error
          ? error.message
          : "An unexpected error occurred while awarding loyalty points",
        [error instanceof Error ? error.message : "Unknown error"],
      );
    }
  }
}
