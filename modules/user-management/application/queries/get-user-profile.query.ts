import { IQuery, IQueryHandler } from '../../../../packages/core/src/application/cqrs';
import { UserProfileService } from '../services/user-profile.service';
import { UserProfileDTO } from '../../domain/entities/user-profile.entity';

export interface GetUserProfileQuery extends IQuery {
  readonly userId: string;
}

export class GetUserProfileHandler implements IQueryHandler<GetUserProfileQuery, UserProfileDTO> {
  constructor(private readonly userProfileService: UserProfileService) {}

  async handle(query: GetUserProfileQuery): Promise<UserProfileDTO> {
    return this.userProfileService.getUserProfile(query.userId);
  }
}
