import { ILoyaltyProgramRepository } from '../../domain/repositories/loyalty-program.repository';
import { LoyaltyProgram, LoyaltyProgramDTO } from '../../domain/entities/loyalty-program.entity';
import { LoyaltyProgramId } from '../../domain/value-objects/loyalty-program-id.vo';
import { LoyaltyProgramNotFoundError } from '../../domain/errors/loyalty.errors';

export class LoyaltyProgramService {
  constructor(private readonly loyaltyProgramRepository: ILoyaltyProgramRepository) {}

  async getLoyaltyProgram(programId: string): Promise<LoyaltyProgramDTO | null> {
    const program = await this.loyaltyProgramRepository.findById(
      LoyaltyProgramId.fromString(programId),
    );
    return program ? LoyaltyProgram.toDTO(program) : null;
  }

  async getLoyaltyProgramByName(name: string): Promise<LoyaltyProgramDTO | null> {
    const program = await this.loyaltyProgramRepository.findByName(name);
    return program ? LoyaltyProgram.toDTO(program) : null;
  }

  async getAllLoyaltyPrograms(): Promise<LoyaltyProgramDTO[]> {
    const result = await this.loyaltyProgramRepository.findAll();
    return result.items.map((p) => LoyaltyProgram.toDTO(p));
  }

  async deleteLoyaltyProgram(programId: string): Promise<void> {
    const id = LoyaltyProgramId.fromString(programId);
    const exists = await this.loyaltyProgramRepository.exists(id);
    if (!exists) throw new LoyaltyProgramNotFoundError(programId);
    await this.loyaltyProgramRepository.delete(id);
  }
}
