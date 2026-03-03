import { UserProfileService } from "../services/user-profile.service";
import {
  IQuery,
  IQueryHandler,
  QueryResult,
} from "@/api/src/shared/application";

export interface GetUserProfileQuery extends IQuery {
  userId: string;
}

export interface UserProfileResult {
  userId: string;
  defaultAddressId?: string;
  defaultPaymentMethodId?: string;
  preferences: Record<string, any>;
  locale?: string;
  currency?: string;
  stylePreferences: Record<string, any>;
  preferredSizes: Record<string, any>;
}

export class GetUserProfileHandler implements IQueryHandler<
  GetUserProfileQuery,
  QueryResult<UserProfileResult>
> {
  constructor(private readonly userProfileService: UserProfileService) {}

  async handle(
    query: GetUserProfileQuery,
  ): Promise<QueryResult<UserProfileResult>> {
    try {
      // Validate query
      if (!query.userId) {
        return QueryResult.failure<UserProfileResult>("User ID is required");
      }

      // Get profile through service
      const profile = await this.userProfileService.getUserProfile(
        query.userId,
      );

      if (!profile) {
        return QueryResult.failure<UserProfileResult>(
          "User profile not found",
        );
      }

      console.log("[DEBUG HANDLER] Profile from service:", {
        prefs: profile.prefs,
        stylePreferences: profile.stylePreferences,
        preferredSizes: profile.preferredSizes,
      });

      const result: UserProfileResult = {
        userId: profile.userId,
        defaultAddressId: profile.defaultAddressId ?? undefined,
        defaultPaymentMethodId: profile.defaultPaymentMethodId ?? undefined,
        preferences: profile.prefs,
        locale: profile.locale ?? undefined,
        currency: profile.currency ?? undefined,
        stylePreferences: profile.stylePreferences,
        preferredSizes: profile.preferredSizes,
      };

      console.log("[DEBUG HANDLER] Final result:", {
        preferences: result.preferences,
        stylePreferences: result.stylePreferences,
        preferredSizes: result.preferredSizes,
      });

      return QueryResult.success<UserProfileResult>(result);
    } catch (error) {
      if (error instanceof Error) {
        return QueryResult.failure<UserProfileResult>(
          `Failed to retrieve user profile: ${error.message}`,
        );
      }

      return QueryResult.failure<UserProfileResult>(
        "An unexpected error occurred while retrieving profile",
      );
    }
  }
}
