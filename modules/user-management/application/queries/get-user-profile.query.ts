import { UserProfileService } from '../services/user-profile.service';
import { UserProfileDTO } from '../../domain/entities/user-profile.entity';
import {
  IQuery,
  IQueryHandler,
} from '../../../../packages/core/src/application/cqrs';

export interface GetUserProfileInput extends IQuery {
  userId: string;
}

export class GetUserProfileHandler implements IQueryHandler<GetUserProfileInput, UserProfileDTO> {
  constructor(private readonly userProfileService: UserProfileService) {}

  async handle(input: GetUserProfileInput): Promise<UserProfileDTO> {
    return this.userProfileService.getUserProfile(input.userId);
  }
}
