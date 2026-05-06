import { FastifyReply } from "fastify";
import { AuthenticatedRequest } from "@/api/src/shared/interfaces/authenticated-request.interface";
import { ResponseHelper } from "@/api/src/shared/response.helper";
import {
  GetUserProfileHandler,
  UpdateProfileHandler,
} from "../../../application";
import { UpdateProfileBody } from "../validation/profile.schema";

export class ProfileController {
  constructor(
    private readonly getProfileHandler: GetUserProfileHandler,
    private readonly updateProfileHandler: UpdateProfileHandler,
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
}
