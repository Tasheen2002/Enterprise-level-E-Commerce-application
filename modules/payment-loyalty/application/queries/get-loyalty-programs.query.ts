import { IQuery, IQueryHandler, QueryResult } from "@/api/src/shared/application";
import {
  LoyaltyService,
  LoyaltyProgramDto,
} from "../services/loyalty.service";

export interface GetLoyaltyProgramsQuery extends IQuery {}

export class GetLoyaltyProgramsHandler implements IQueryHandler<
  GetLoyaltyProgramsQuery,
  QueryResult<LoyaltyProgramDto[]>
> {
  constructor(private readonly loyaltyService: LoyaltyService) {}

  async handle(
    _query: GetLoyaltyProgramsQuery,
  ): Promise<QueryResult<LoyaltyProgramDto[]>> {
    try {
      const programs = await this.loyaltyService.getAllLoyaltyPrograms();
      return QueryResult.success<LoyaltyProgramDto[]>(programs);
    } catch (error) {
      return QueryResult.failure<LoyaltyProgramDto[]>(
        error instanceof Error ? error.message : "An unexpected error occurred while retrieving loyalty programs",
      );
    }
  }
}
