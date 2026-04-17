import {
  IQuery,
  IQueryHandler,
} from '../../../../packages/core/src/application/cqrs';
import { LoyaltyProgram, LoyaltyProgramDTO } from '../../domain/entities/loyalty-program.entity';
import { ILoyaltyProgramRepository } from '../../domain/repositories/loyalty-program.repository';

export interface GetLoyaltyProgramsQuery extends IQuery {}

export class GetLoyaltyProgramsHandler implements IQueryHandler<
  GetLoyaltyProgramsQuery,
  LoyaltyProgramDTO[]
> {
  constructor(private readonly loyaltyProgramRepository: ILoyaltyProgramRepository) {}

  async handle(): Promise<LoyaltyProgramDTO[]> {
    const result = await this.loyaltyProgramRepository.findAll();
    return result.items.map((p) => LoyaltyProgram.toDTO(p));
  }
}
