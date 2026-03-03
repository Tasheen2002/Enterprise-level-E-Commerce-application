import { LoyaltyProgram } from "../entities/loyalty-program.entity";

export interface ILoyaltyProgramRepository {
  save(program: LoyaltyProgram): Promise<void>;
  update(program: LoyaltyProgram): Promise<void>;
  delete(programId: string): Promise<void>;
  findById(programId: string): Promise<LoyaltyProgram | null>;
  findByName(name: string): Promise<LoyaltyProgram | null>;
  findAll(): Promise<LoyaltyProgram[]>;
  exists(programId: string): Promise<boolean>;
}
