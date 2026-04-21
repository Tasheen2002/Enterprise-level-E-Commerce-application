import {
  IQuery,
  IQueryHandler,
} from '../../../../packages/core/src/application/cqrs';
import { LoyaltyProgramService } from '../services/loyalty-program.service';
import { LoyaltyProgramDTO } from '../../domain/entities/loyalty-program.entity';

export interface GetLoyaltyProgramsQuery extends IQuery {}

export class GetLoyaltyProgramsHandler implements IQueryHandler<
  GetLoyaltyProgramsQuery,
  LoyaltyProgramDTO[]
> {
  constructor(private readonly loyaltyProgramService: LoyaltyProgramService) {}

  async handle(_query: GetLoyaltyProgramsQuery): Promise<LoyaltyProgramDTO[]> {
    return this.loyaltyProgramService.getAllLoyaltyPrograms();
  }
}
