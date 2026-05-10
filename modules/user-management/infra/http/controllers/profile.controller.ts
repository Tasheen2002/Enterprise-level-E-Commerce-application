import { FastifyReply } from "fastify";
import { AuthenticatedRequest } from "@/api/src/shared/interfaces/authenticated-request.interface";
import { ResponseHelper } from "@/api/src/shared/response.helper";
import {
  GetUserProfileHandler,
  UpdateProfileHandler,
} from "../../../application";
import { UpdateProfileBody } from "../validation/profile.schema";
import { ImageKitUploadAuthService } from "../../../application/services/imagekit-upload-auth.service";

export class ProfileController {
  constructor(
    private readonly getProfileHandler: GetUserProfileHandler,
    private readonly updateProfileHandler: UpdateProfileHandler,
    // Optional — null when ImageKit isn't configured. The avatar upload
    // route returns 503 in that case.
    private readonly imageKitUploadAuth: ImageKitUploadAuthService | null,
  ) { }

  // --- Queries ---

  async getCurrentUserProfile(
    request: AuthenticatedRequest,
    reply: FastifyReply,
  ) {
    try {
      const result = await this.getProfileHandler.handle({
        userId: request.user.userId,
      });
      return ResponseHelper.ok(reply, "Profile retrieved", result);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  // --- Commands ---

  async updateCurrentUserProfile(
    request: AuthenticatedRequest<{ Body: UpdateProfileBody }>,
    reply: FastifyReply,
  ) {
    try {
      const result = await this.updateProfileHandler.handle({
        userId: request.user.userId,
        defaultAddressId: request.body.defaultAddressId,
        defaultPaymentMethodId: request.body.defaultPaymentMethodId,
        avatarUrl: request.body.avatarUrl,
        prefs: request.body.prefs,
        locale: request.body.locale,
        currency: request.body.currency,
        stylePreferences: request.body.stylePreferences,
        preferredSizes: request.body.preferredSizes,
        firstName: request.body.firstName,
        lastName: request.body.lastName,
        phone: request.body.phone,
        title: request.body.title,
        dateOfBirth: request.body.dateOfBirth,
        residentOf: request.body.residentOf,
        nationality: request.body.nationality,
      });
      return ResponseHelper.fromCommand(reply, result, "Profile updated");
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  /**
   * Issue a short-lived ImageKit upload token scoped to the current
   * user's avatar folder. The browser uses these params to upload the
   * file directly to ImageKit, then PATCHes /users/me/profile with the
   * resulting URL.
   */
  async getAvatarUploadToken(
    request: AuthenticatedRequest,
    reply: FastifyReply,
  ) {
    if (!this.imageKitUploadAuth) {
      return ResponseHelper.error(reply, {
        statusCode: 503,
        message: "Image upload is not configured on this server.",
      });
    }
    try {
      const token = this.imageKitUploadAuth.issue({
        subjectId: request.user.userId,
      });
      return ResponseHelper.ok(reply, "Upload token issued", token);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }
}
