import { FastifyRequest, FastifyReply } from "fastify";
import {
  UpdateProfileCommand,
  UpdateProfileHandler,
  GetUserProfileQuery,
  GetUserProfileHandler,
} from "../../../application";
import { UserProfileService } from "../../../application/services/user-profile.service";
import { ResponseHelper } from "@/api/src/shared/response.helper";

// Request DTOs
export interface UpdateProfileRequest {
  defaultAddressId?: string;
  defaultPaymentMethodId?: string;
  preferences?: Record<string, any>;
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

export class ProfileController {
  private getProfileHandler: GetUserProfileHandler;
  private updateProfileHandler: UpdateProfileHandler;

  constructor(userProfileService: UserProfileService) {
    this.getProfileHandler = new GetUserProfileHandler(userProfileService);
    this.updateProfileHandler = new UpdateProfileHandler(userProfileService);
  }

  async getProfile(
    request: FastifyRequest<{ Params: { userId: string } }>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const { userId } = request.params;
      const query: GetUserProfileQuery = { userId, timestamp: new Date() };
      const result = await this.getProfileHandler.handle(query);
      ResponseHelper.fromQuery(reply, result, "Profile retrieved", "User profile not found");
    } catch (error) {
      ResponseHelper.error(reply, error);
    }
  }

  async updateProfile(
    request: FastifyRequest<{
      Params: { userId: string };
      Body: UpdateProfileRequest;
    }>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const { userId } = request.params;
      const {
        defaultAddressId,
        defaultPaymentMethodId,
        preferences,
        locale,
        currency,
        stylePreferences,
        preferredSizes,
        firstName,
        lastName,
        phone,
        title,
        dateOfBirth,
        residentOf,
        nationality,
      } = request.body;

      const command: UpdateProfileCommand = {
        userId,
        defaultAddressId,
        defaultPaymentMethodId,
        prefs: preferences,
        locale,
        currency,
        stylePreferences,
        preferredSizes,
        firstName,
        lastName,
        phone,
        title,
        dateOfBirth,
        residentOf,
        nationality,
        timestamp: new Date(),
      };

      const result = await this.updateProfileHandler.handle(command);
      ResponseHelper.fromCommand(reply, result, "Profile updated");
    } catch (error) {
      ResponseHelper.error(reply, error);
    }
  }

  async getCurrentUserProfile(
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const userId = (request as any).user?.userId;
      if (!userId) {
        return ResponseHelper.unauthorized(reply);
      }
      const query: GetUserProfileQuery = { userId, timestamp: new Date() };
      const result = await this.getProfileHandler.handle(query);
      ResponseHelper.fromQuery(reply, result, "Profile retrieved", "User profile not found");
    } catch (error) {
      ResponseHelper.error(reply, error);
    }
  }

  async updateCurrentUserProfile(
    request: FastifyRequest<{ Body: UpdateProfileRequest }>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const userId = (request as any).user?.userId;
      if (!userId) {
        return ResponseHelper.unauthorized(reply);
      }

      const {
        defaultAddressId,
        defaultPaymentMethodId,
        preferences,
        locale,
        currency,
        stylePreferences,
        preferredSizes,
        firstName,
        lastName,
        phone,
        title,
        dateOfBirth,
        residentOf,
        nationality,
      } = request.body;

      const command: UpdateProfileCommand = {
        userId,
        defaultAddressId,
        defaultPaymentMethodId,
        prefs: preferences,
        locale,
        currency,
        stylePreferences,
        preferredSizes,
        firstName,
        lastName,
        phone,
        title,
        dateOfBirth,
        residentOf,
        nationality,
        timestamp: new Date(),
      };

      const result = await this.updateProfileHandler.handle(command);
      ResponseHelper.fromCommand(reply, result, "Profile updated");
    } catch (error) {
      ResponseHelper.error(reply, error);
    }
  }
}
