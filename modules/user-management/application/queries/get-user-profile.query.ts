import { UserProfileService } from '../services/user-profile.service';
import { UserProfileDTO } from '../../domain/entities/user-profile.entity';
import {
  IQuery,
  IQueryHandler,
  QueryResult,
} from '../../../../packages/core/src/application/cqrs';

export interface GetUserProfileQuery extends IQuery {
  readonly userId: string;
}

export class GetUserProfileHandler implements IQueryHandler<GetUserProfileQuery, QueryResult<UserProfileDTO>> {
  constructor(private readonly userProfileService: UserProfileService) {}

  async handle(query: GetUserProfileQuery): Promise<QueryResult<UserProfileDTO>> {
    try {
      const data = await this.userProfileService.getUserProfile(query.userId);
      return QueryResult.success(data);
    } catch (error) {
      return QueryResult.fromError(error);
    }
  }
}
