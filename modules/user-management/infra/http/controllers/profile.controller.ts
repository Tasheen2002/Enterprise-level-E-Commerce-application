import { FastifyReply } from "fastify";
import { AuthenticatedRequest } from "@/api/src/shared/interfaces/authenticated-request.interface";
import { ResponseHelper } from "@/api/src/shared/response.helper";
import {
  GetUserProfileInput,
  GetUserProfileHandler,
} from "../../../application/queries/get-user-profile.query";
import {
  UpdateProfileInput,
  UpdateProfileHandler,
} from "../../../application/commands/update-profile.command";

export class ProfileController {
  constructor(
    private readonly getProfileHandler: GetUserProfileHandler,
    private readonly updateProfileHandler: UpdateProfileHandler,
  ) {}

  async getCurrentUserProfile(
    request: AuthenticatedRequest,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const query: GetUserProfileInput = {
        userId: request.user.userId,
        timestamp: new Date(),
      };
      const result = await this.getProfileHandler.handle(query);
      return ResponseHelper.fromQuery(
        reply,
        result,
        "Profile retrieved",
        "User profile not found",
      );
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async updateCurrentUserProfile(
    request: AuthenticatedRequest<{
      Body: {
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
      };
    }>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
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

      const command: UpdateProfileInput = {
        userId: request.user.userId,
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
      return ResponseHelper.fromCommand(reply, result, "Profile updated");
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async getProfile(
    request: AuthenticatedRequest<{ Params: { userId: string } }>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const { userId } = request.params;
      const query: GetUserProfileInput = { userId, timestamp: new Date() };
      const result = await this.getProfileHandler.handle(query);
      return ResponseHelper.fromQuery(
        reply,
        result,
        "Profile retrieved",
        "User profile not found",
      );
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async updateProfile(
    request: AuthenticatedRequest<{
      Params: { userId: string };
      Body: {
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
      };
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

      const command: UpdateProfileInput = {
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
      return ResponseHelper.fromCommand(reply, result, "Profile updated");
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }
}
