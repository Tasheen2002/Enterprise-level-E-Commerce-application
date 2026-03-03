import { UserProfileService } from "../services/user-profile.service";
import {
  ICommand,
  ICommandHandler,
  CommandResult,
} from "@/api/src/shared/application";

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

export interface UpdateProfileResult {
  userId: string;
  defaultAddressId?: string | null;
  defaultPaymentMethodId?: string | null;
  prefs: Record<string, any>;
  locale?: string | null;
  currency?: string | null;
  stylePreferences: Record<string, any>;
  preferredSizes: Record<string, any>;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  title?: string | null;
  dateOfBirth?: string | null;
  residentOf?: string | null;
  nationality?: string | null;
  updatedAt: string;
}

export class UpdateProfileHandler implements ICommandHandler<
  UpdateProfileCommand,
  CommandResult<UpdateProfileResult>
> {
  constructor(private readonly userProfileService: UserProfileService) {}

  async handle(
    command: UpdateProfileCommand,
  ): Promise<CommandResult<UpdateProfileResult>> {
    try {
      // Validate command
      if (!command.userId) {
        return CommandResult.failure<UpdateProfileResult>(
          "User ID is required",
          ["userId"],
        );
      }

      // Update profile through service
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
        },
      );

      const result: UpdateProfileResult = {
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
      };

      return CommandResult.success<UpdateProfileResult>(result);
    } catch (error) {
      if (error instanceof Error) {
        return CommandResult.failure<UpdateProfileResult>(
          "Profile update failed",
          [error.message],
        );
      }

      return CommandResult.failure<UpdateProfileResult>(
        "An unexpected error occurred during profile update",
      );
    }
  }
}
