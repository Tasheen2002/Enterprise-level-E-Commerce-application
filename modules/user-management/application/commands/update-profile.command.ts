import { UserProfileService } from '../services/user-profile.service';
import { UserProfileDTO } from '../../domain/entities/user-profile.entity';
import { ICommand, ICommandHandler, CommandResult } from '../../../../packages/core/src/application/cqrs';

export interface UpdateProfileCommand extends ICommand {
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
