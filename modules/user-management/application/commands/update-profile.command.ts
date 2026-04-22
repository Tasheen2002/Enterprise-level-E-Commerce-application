import { UserProfileService } from '../services/user-profile.service';
import {
  UserProfileDTO,
  UserPreferences,
  StylePreferences,
  PreferredSizes,
} from '../../domain/entities/user-profile.entity';
import { ICommand, ICommandHandler, CommandResult } from '../../../../packages/core/src/application/cqrs';

export interface UpdateProfileCommand extends ICommand {
  readonly userId: string;
  readonly defaultAddressId?: string;
  readonly defaultPaymentMethodId?: string;
  readonly prefs?: UserPreferences;
  readonly locale?: string;
  readonly currency?: string;
  readonly stylePreferences?: StylePreferences;
  readonly preferredSizes?: PreferredSizes;
  readonly firstName?: string;
  readonly lastName?: string;
  readonly phone?: string;
  readonly title?: string;
  readonly dateOfBirth?: string;
  readonly residentOf?: string;
  readonly nationality?: string;
}

export class UpdateProfileHandler
  implements
    ICommandHandler<UpdateProfileCommand, CommandResult<UserProfileDTO>>
{
  constructor(
    private readonly userProfileService: UserProfileService
  ) {}

  async handle(
    command: UpdateProfileCommand
  ): Promise<CommandResult<UserProfileDTO>> {
    const updatedProfile = await this.userProfileService.updateUserProfile(
      command.userId,
      {
        defaultAddressId: command.defaultAddressId,
        defaultPaymentMethodId: command.defaultPaymentMethodId,
        prefs: command.prefs,
        locale: command.locale,
        currency: command.currency,
        stylePreferences: command.stylePreferences,
        preferredSizes: command.preferredSizes,
        firstName: command.firstName,
        lastName: command.lastName,
        phone: command.phone,
        title: command.title,
        dateOfBirth: command.dateOfBirth,
        residentOf: command.residentOf,
        nationality: command.nationality,
      }
    );
    return CommandResult.success(updatedProfile);
  }
}
