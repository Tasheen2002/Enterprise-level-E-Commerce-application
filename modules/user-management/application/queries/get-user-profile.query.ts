import { UserProfileService, UserProfileDto } from '../services/user-profile.service';
import {
  IQuery,
  IQueryHandler,
} from '../../../../packages/core/src/application/cqrs';
import { QueryResult } from '../../../../packages/core/src/application/query-result';

export interface GetUserProfileInput extends IQuery {
  userId: string;
}

export class GetUserProfileHandler implements IQueryHandler<
  GetUserProfileInput,
  QueryResult<UserProfileDto>
> {
  constructor(private readonly userProfileService: UserProfileService) {}

  async handle(
    input: GetUserProfileInput
  ): Promise<QueryResult<UserProfileDto>> {
    const profile = await this.userProfileService.getUserProfile(input.userId);
    return QueryResult.success(profile);
  }
}
