import { IQuery, IQueryHandler } from '../../../../packages/core/src/application/cqrs';
import { UserProfileService, UserProfileViewDTO } from '../services/user-profile.service';

export interface GetUserProfileQuery extends IQuery {
  readonly userId: string;
}

export class GetUserProfileHandler implements IQueryHandler<GetUserProfileQuery, UserProfileViewDTO> {
  constructor(private readonly userProfileService: UserProfileService) { }

  async handle(query: GetUserProfileQuery): Promise<UserProfileViewDTO> {
    return this.userProfileService.getUserProfile(query.userId);
  }
}
