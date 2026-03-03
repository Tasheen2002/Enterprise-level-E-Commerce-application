import {
  LoyaltyService,
  CreateLoyaltyProgramDto,
  LoyaltyProgramDto,
} from "../services/loyalty.service";
import {
  LoyaltyTier,
  EarnRule,
  BurnRule,
} from "../../domain/entities/loyalty-program.entity";
import {
  ICommand,
  ICommandHandler,
  CommandResult,
} from "@/api/src/shared/application";

export interface CreateLoyaltyProgramCommand extends ICommand {
  name: string;
  earnRules: EarnRule | EarnRule[];
  burnRules: BurnRule | BurnRule[];
  tiers: LoyaltyTier[];
}

export class CreateLoyaltyProgramHandler implements ICommandHandler<
  CreateLoyaltyProgramCommand,
  CommandResult<LoyaltyProgramDto>
> {
  constructor(private readonly loyaltyService: LoyaltyService) {}

  async handle(
    command: CreateLoyaltyProgramCommand,
  ): Promise<CommandResult<LoyaltyProgramDto>> {
    try {
      const errors: string[] = [];
      if (!command.name) errors.push("name");
      if (!command.earnRules) errors.push("earnRules");
      if (!command.burnRules) errors.push("burnRules");
      if (!command.tiers || command.tiers.length === 0) errors.push("tiers");

      if (errors.length > 0) {
        return CommandResult.failure<LoyaltyProgramDto>(
          "Validation failed",
          errors,
        );
      }

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
        error instanceof Error ? error.message : "An unexpected error occurred while creating loyalty program",
        [error instanceof Error ? error.message : "Unknown error"],
      );
    }
  }
}
