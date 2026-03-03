import { ILoyaltyProgramRepository } from "../../domain/repositories/loyalty-program.repository";
import {
  LoyaltyProgram,
  EarnRule,
  BurnRule,
  LoyaltyTier,
} from "../../domain/entities/loyalty-program.entity";

export interface LoyaltyProgramDto {
  programId: string;
  name: string;
  earnRules: EarnRule | EarnRule[];
  burnRules: BurnRule | BurnRule[];
  tiers: LoyaltyTier[];
}

export class LoyaltyProgramService {
  constructor(private readonly loyaltyProgramRepo: ILoyaltyProgramRepository) {}

  async getLoyaltyProgram(
    programId: string,
  ): Promise<LoyaltyProgramDto | null> {
    const program = await this.loyaltyProgramRepo.findById(programId);
    return program ? this.toDto(program) : null;
  }

  async getLoyaltyProgramByName(
    name: string,
  ): Promise<LoyaltyProgramDto | null> {
    const program = await this.loyaltyProgramRepo.findByName(name);
    return program ? this.toDto(program) : null;
  }

  async getAllLoyaltyPrograms(): Promise<LoyaltyProgramDto[]> {
    const programs = await this.loyaltyProgramRepo.findAll();
    return programs.map((p) => this.toDto(p));
  }

  private toDto(program: LoyaltyProgram): LoyaltyProgramDto {
    return {
      programId: program.programId,
      name: program.name,
      earnRules: program.earnRules,
      burnRules: program.burnRules,
      tiers: program.tiers,
    };
  }
}
