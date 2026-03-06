import { IQueryHandler, QueryResult } from "@/api/src/shared/application";
import { UserProfileService } from "../../services/user-profile.service";
import { GetUserProfileQuery, UserProfileResult } from "./get-user-profile.query";

export class GetUserProfileHandler implements IQueryHandler<GetUserProfileQuery, QueryResult<UserProfileResult>> {
  constructor(private readonly userProfileService: UserProfileService) {}

  async handle(query: GetUserProfileQuery): Promise<QueryResult<UserProfileResult>> {
    try {
      const profile = await this.userProfileService.getUserProfile(query.userId);
      if (!profile) {
        return QueryResult.failure<UserProfileResult>("User profile not found");
      }
      return QueryResult.success<UserProfileResult>({
        userId: profile.userId,
        defaultAddressId: profile.defaultAddressId ?? undefined,
        defaultPaymentMethodId: profile.defaultPaymentMethodId ?? undefined,
        preferences: profile.prefs,
        locale: profile.locale ?? undefined,
        currency: profile.currency ?? undefined,
        stylePreferences: profile.stylePreferences,
        preferredSizes: profile.preferredSizes,
      });
    } catch (error) {
      return QueryResult.failure<UserProfileResult>(
        error instanceof Error ? error.message : "Failed to retrieve user profile",
      );
    }
  }
}
