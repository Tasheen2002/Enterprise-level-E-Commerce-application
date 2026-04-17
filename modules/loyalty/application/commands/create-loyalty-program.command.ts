import {
  ICommand,
  ICommandHandler,
  CommandResult,
} from '../../../../packages/core/src/application/cqrs';
import { LoyaltyProgram, LoyaltyProgramDTO, EarnRule, BurnRule, LoyaltyTierConfig } from '../../domain/entities/loyalty-program.entity';
import { ILoyaltyProgramRepository } from '../../domain/repositories/loyalty-program.repository';

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
  constructor(private readonly loyaltyProgramRepository: ILoyaltyProgramRepository) {}

  async handle(command: CreateLoyaltyProgramCommand): Promise<CommandResult<LoyaltyProgramDTO>> {
    const program = LoyaltyProgram.create({
      name: command.name,
      earnRules: command.earnRules,
      burnRules: command.burnRules,
      tiers: command.tiers,
    });
    await this.loyaltyProgramRepository.save(program);
    return CommandResult.success(LoyaltyProgram.toDTO(program));
  }
}
