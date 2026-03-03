import {
  LoyaltyService,
  CreateLoyaltyProgramDto,
  LoyaltyProgramDto,
} from "../services/loyalty.service";
import { ICommandHandler, CommandResult } from "@/api/src/shared/application";
import { CreateLoyaltyProgramCommand } from "./create-loyalty-program.command";

export class CreateLoyaltyProgramHandler implements ICommandHandler<
  CreateLoyaltyProgramCommand,
  CommandResult<LoyaltyProgramDto>
> {
  constructor(private readonly loyaltyService: LoyaltyService) {}

  async handle(
    command: CreateLoyaltyProgramCommand,
  ): Promise<CommandResult<LoyaltyProgramDto>> {
    try {
      const dto: CreateLoyaltyProgramDto = {
        name: command.name,
        earnRules: command.earnRules,
        burnRules: command.burnRules,
        tiers: command.tiers,
      };

      const program = await this.loyaltyService.createLoyaltyProgram(dto);
      return CommandResult.success<LoyaltyProgramDto>(program);
    } catch (error) {
      return CommandResult.failure<LoyaltyProgramDto>(
        error instanceof Error
          ? error.message
          : "An unexpected error occurred while creating loyalty program",
        [error instanceof Error ? error.message : "Unknown error"],
      );
    }
  }
}
