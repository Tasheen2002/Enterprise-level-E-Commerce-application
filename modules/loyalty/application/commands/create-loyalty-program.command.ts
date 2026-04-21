import {
  ICommand,
  ICommandHandler,
  CommandResult,
} from '../../../../packages/core/src/application/cqrs';
import { LoyaltyProgramService } from '../services/loyalty-program.service';
import { LoyaltyProgramDTO, EarnRule, BurnRule, LoyaltyTierConfig } from '../../domain/entities/loyalty-program.entity';

export interface CreateLoyaltyProgramCommand extends ICommand {
  readonly name: string;
  readonly earnRules: EarnRule[];
  readonly burnRules: BurnRule[];
  readonly tiers: LoyaltyTierConfig[];
}

export class CreateLoyaltyProgramHandler implements ICommandHandler<
  CreateLoyaltyProgramCommand,
  CommandResult<LoyaltyProgramDTO>
> {
  constructor(private readonly loyaltyProgramService: LoyaltyProgramService) {}

  async handle(command: CreateLoyaltyProgramCommand): Promise<CommandResult<LoyaltyProgramDTO>> {
    const program = await this.loyaltyProgramService.createLoyaltyProgram({
      name: command.name,
      earnRules: command.earnRules,
      burnRules: command.burnRules,
      tiers: command.tiers,
    });
    return CommandResult.success(program);
  }
}
