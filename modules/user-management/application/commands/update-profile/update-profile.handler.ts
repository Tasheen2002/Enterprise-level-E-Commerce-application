import { ICommandHandler, CommandResult } from "@/api/src/shared/application";
import { UserProfileService } from "../../services/user-profile.service";
import { UpdateProfileCommand, UpdateProfileResult } from "./update-profile.command";

export class UpdateProfileHandler implements ICommandHandler<UpdateProfileCommand, CommandResult<UpdateProfileResult>> {
  constructor(private readonly userProfileService: UserProfileService) {}

  async handle(command: UpdateProfileCommand): Promise<CommandResult<UpdateProfileResult>> {
    try {
      const updatedProfile = await this.userProfileService.updateUserProfile(command.userId, {
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
      });

      return CommandResult.success<UpdateProfileResult>({
        userId: updatedProfile.userId,
        defaultAddressId: updatedProfile.defaultAddressId,
        defaultPaymentMethodId: updatedProfile.defaultPaymentMethodId,
        prefs: updatedProfile.prefs,
        locale: updatedProfile.locale,
        currency: updatedProfile.currency,
        stylePreferences: updatedProfile.stylePreferences,
        preferredSizes: updatedProfile.preferredSizes,
        firstName: updatedProfile.firstName,
        lastName: updatedProfile.lastName,
        phone: updatedProfile.phone,
        title: updatedProfile.title,
        dateOfBirth: updatedProfile.dateOfBirth,
        residentOf: updatedProfile.residentOf,
        nationality: updatedProfile.nationality,
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      return CommandResult.failure<UpdateProfileResult>(
        error instanceof Error ? error.message : "Profile update failed",
      );
    }
  }
}
