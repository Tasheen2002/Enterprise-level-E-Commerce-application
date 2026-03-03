import {
  LoyaltyService,
  RedeemPointsDto,
  LoyaltyAccountDto,
} from "../services/loyalty.service";
import { ICommandHandler, CommandResult } from "@/api/src/shared/application";
import { RedeemLoyaltyPointsCommand } from "./redeem-loyalty-points.command";

export class RedeemLoyaltyPointsHandler implements ICommandHandler<
  RedeemLoyaltyPointsCommand,
  CommandResult<LoyaltyAccountDto>
> {
  constructor(private readonly loyaltyService: LoyaltyService) {}

  async handle(
    command: RedeemLoyaltyPointsCommand,
  ): Promise<CommandResult<LoyaltyAccountDto>> {
    try {
      const dto: RedeemPointsDto = {
        userId: command.userId,
        programId: command.programId,
        points: command.points,
        orderId: command.orderId,
      };

      const account = await this.loyaltyService.redeemPoints(dto);

      return CommandResult.success<LoyaltyAccountDto>(account);
    } catch (error) {
      return CommandResult.failure<LoyaltyAccountDto>(
        error instanceof Error
          ? error.message
          : "An unexpected error occurred while redeeming loyalty points",
        [error instanceof Error ? error.message : "Unknown error"],
      );
    }
  }
}
