import { LoyaltyProgram } from '../entities/loyalty-program.entity';
import { LoyaltyProgramId } from '../value-objects/loyalty-program-id.vo';
import {
  PaginatedResult,
  PaginationOptions,
} from '../../../../packages/core/src/domain/interfaces/paginated-result.interface';

export interface LoyaltyProgramFilters {
  name?: string;
}

export interface ILoyaltyProgramRepository {
  save(program: LoyaltyProgram): Promise<void>;
  update(program: LoyaltyProgram): Promise<void>;
  delete(id: LoyaltyProgramId): Promise<void>;
  findById(id: LoyaltyProgramId): Promise<LoyaltyProgram | null>;
  findByName(name: string): Promise<LoyaltyProgram | null>;
  findAll(options?: LoyaltyProgramQueryOptions): Promise<PaginatedResult<LoyaltyProgram>>;
  count(filters?: LoyaltyProgramFilters): Promise<number>;
  exists(id: LoyaltyProgramId): Promise<boolean>;
}

export interface LoyaltyProgramQueryOptions extends PaginationOptions {
  sortBy?: 'createdAt' | 'updatedAt';
}
