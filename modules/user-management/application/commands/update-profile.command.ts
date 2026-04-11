import { UserProfileService } from '../services/user-profile.service';
import { UserProfileDTO } from '../../domain/entities/user-profile.entity';
import {
  ICommand,
  ICommandHandler,
} from '../../../../packages/core/src/application/cqrs';
import { CommandResult } from '../../../../packages/core/src/application/command-result';

export interface UpdateProfileInput extends ICommand {
  userId: string;
  defaultAddressId?: string;
  defaultPaymentMethodId?: string;
  prefs?: Record<string, any>;
  locale?: string;
  currency?: string;
  stylePreferences?: Record<string, any>;
  preferredSizes?: Record<string, any>;
  firstName?: string;
  lastName?: string;
  phone?: string;
  title?: string;
  dateOfBirth?: string;
  residentOf?: string;
  nationality?: string;
}

export class UpdateProfileHandler
  implements
    ICommandHandler<UpdateProfileInput, CommandResult<UserProfileDTO>>
{
  constructor(
    private readonly userProfileService: UserProfileService
  ) {}

  async handle(
    input: UpdateProfileInput
  ): Promise<CommandResult<UserProfileDTO>> {
    const updatedProfile = await this.userProfileService.updateUserProfile(
      input.userId,
      {
        defaultAddressId: input.defaultAddressId,
        defaultPaymentMethodId: input.defaultPaymentMethodId,
        prefs: input.prefs,
        locale: input.locale,
        currency: input.currency,
        stylePreferences: input.stylePreferences,
        preferredSizes: input.preferredSizes,
        firstName: input.firstName,
        lastName: input.lastName,
        phone: input.phone,
        title: input.title,
        dateOfBirth: input.dateOfBirth,
        residentOf: input.residentOf,
        nationality: input.nationality,
      }
    );
    return CommandResult.success(updatedProfile);
  }
}
