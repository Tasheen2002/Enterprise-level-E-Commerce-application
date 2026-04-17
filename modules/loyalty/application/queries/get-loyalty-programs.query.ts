import {
  IQuery,
  IQueryHandler,
  QueryResult,
} from '../../../../packages/core/src/application/cqrs';
import { LoyaltyProgram, LoyaltyProgramDTO } from '../../domain/entities/loyalty-program.entity';
import { ILoyaltyProgramRepository } from '../../domain/repositories/loyalty-program.repository';

export interface GetLoyaltyProgramsQuery extends IQuery {}

export class GetLoyaltyProgramsHandler implements IQueryHandler<
  GetLoyaltyProgramsQuery,
  QueryResult<LoyaltyProgramDTO[]>
> {
  constructor(private readonly loyaltyProgramRepository: ILoyaltyProgramRepository) {}

  async handle(_query: GetLoyaltyProgramsQuery): Promise<QueryResult<LoyaltyProgramDTO[]>> {
    const result = await this.loyaltyProgramRepository.findAll();
    const dtos = result.items.map((p) => LoyaltyProgram.toDTO(p));
    return QueryResult.success(dtos);
  }
}
