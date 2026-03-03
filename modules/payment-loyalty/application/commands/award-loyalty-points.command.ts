import {
  LoyaltyService,
  AwardPointsDto,
  LoyaltyAccountDto,
} from "../services/loyalty.service";
import {
  ICommand,
  ICommandHandler,
  CommandResult,
} from "@/api/src/shared/application";

export interface AwardLoyaltyPointsCommand extends ICommand {
  userId: string;
  programId: string;
  points: number;
  reason: string;
  orderId?: string;
}

export class AwardLoyaltyPointsHandler implements ICommandHandler<
  AwardLoyaltyPointsCommand,
  CommandResult<LoyaltyAccountDto>
> {
  constructor(private readonly loyaltyService: LoyaltyService) {}

  async handle(
    command: AwardLoyaltyPointsCommand,
  ): Promise<CommandResult<LoyaltyAccountDto>> {
    try {
      // Validate command
      if (!command.userId) {
        return CommandResult.failure<LoyaltyAccountDto>("User ID is required", [
          "userId",
        ]);
      }

      if (!command.programId) {
        return CommandResult.failure<LoyaltyAccountDto>(
          "Program ID is required",
          ["programId"],
        );
      }

      if (!command.points || command.points <= 0) {
        return CommandResult.failure<LoyaltyAccountDto>(
          "Points must be greater than 0",
          ["points"],
        );
      }

      if (!command.reason) {
        return CommandResult.failure<LoyaltyAccountDto>("Reason is required", [
          "reason",
        ]);
      }

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
        error instanceof Error ? error.message : "An unexpected error occurred while awarding loyalty points",
        [error instanceof Error ? error.message : "Unknown error"],
      );
    }
  }
}
