import { FastifyReply } from "fastify";
import { AuthenticatedRequest } from "@/api/src/shared/interfaces/authenticated-request.interface";
import { ResponseHelper } from "@/api/src/shared/response.helper";
import {
  GetUserProfileHandler,
  UpdateProfileHandler,
} from "../../../application";
import { UpdateProfileBody } from "../validation/profile.schema";
import { UserIdParams } from "../validation/user.schema";

export class ProfileController {
  constructor(
    private readonly getProfileHandler: GetUserProfileHandler,
    private readonly updateProfileHandler: UpdateProfileHandler,
  ) {}

  async getCurrentUserProfile(
    request: AuthenticatedRequest,
    reply: FastifyReply,
  ) {
    try {
      const result = await this.getProfileHandler.handle({ userId: request.user.userId });
      return ResponseHelper.ok(reply, "Profile retrieved", result);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async updateCurrentUserProfile(
    request: AuthenticatedRequest<{ Body: UpdateProfileBody }>,
    reply: FastifyReply,
  ) {
    try {
      const result = await this.updateProfileHandler.handle({
        userId: request.user.userId,
        ...request.body,
      });
      return ResponseHelper.fromCommand(reply, result, "Profile updated");
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async getProfile(
    request: AuthenticatedRequest<{ Params: UserIdParams }>,
    reply: FastifyReply,
  ) {
    try {
      const result = await this.getProfileHandler.handle({ userId: request.params.userId });
      return ResponseHelper.ok(reply, "Profile retrieved", result);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async updateProfile(
    request: AuthenticatedRequest<{ Params: UserIdParams; Body: UpdateProfileBody }>,
    reply: FastifyReply,
  ) {
    try {
      const result = await this.updateProfileHandler.handle({
        userId: request.params.userId,
        ...request.body,
      });
      return ResponseHelper.fromCommand(reply, result, "Profile updated");
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }
}
