import { FastifyInstance } from "fastify";
import { ProfileController } from "../controllers/profile.controller";
import { AuthenticatedRequest } from "@/api/src/shared/interfaces/authenticated-request.interface";
import { RolePermissions } from "@/api/src/shared/middleware/role-authorization.middleware";
import { authenticate } from "@/api/src/shared/middleware/authenticate.middleware";
import {
  createRateLimiter,
  RateLimitPresets,
  userKeyGenerator,
} from "@/api/src/shared/middleware/rate-limiter.middleware";
import { validateBody, toJsonSchema } from "../validation/validator";
import { successResponse, actionSuccessResponse } from "@/api/src/shared/http/response-schemas";
import {
  updateProfileSchema,
  profileResponseSchema,
  activeSessionResponseSchema,
} from "../validation/profile.schema";

const writeRateLimiter = createRateLimiter({
  ...RateLimitPresets.writeOperations,
  keyGenerator: userKeyGenerator,
});

// Pre-compute JSON Schema from Zod (single source of truth — no drift).
const updateProfileBodyJson = toJsonSchema(updateProfileSchema);

// Mirrors the ImageKitUploadAuth interface — keep in lockstep.
const avatarUploadTokenResponseSchema = {
  type: "object",
  properties: {
    token: { type: "string" },
    expire: { type: "number" },
    signature: { type: "string" },
    publicKey: { type: "string" },
    folder: { type: "string" },
    uploadEndpoint: { type: "string" },
  },
};

export async function profileRoutes(
  fastify: FastifyInstance,
  controller: ProfileController,
) {
  fastify.addHook("onRequest", async (request, reply) => {
    if (request.method !== "GET") {
      await writeRateLimiter(request, reply);
    }
  });

  // GET /users/me/profile
  fastify.get(
    "/users/me/profile",
    {
      preHandler: [authenticate, RolePermissions.AUTHENTICATED],
      schema: {
        tags: ["Profile"],
        summary: "Get current user profile",
        description:
          "Retrieve the authenticated user's full profile including preferences and sizes.",
        security: [{ bearerAuth: [] }],
        response: {
          200: successResponse(profileResponseSchema),
        },
      },
    },
    (request, reply) =>
      controller.getCurrentUserProfile(request as AuthenticatedRequest, reply),
  );

  // PATCH /users/me/profile
  fastify.patch(
    "/users/me/profile",
    {
      preHandler: [authenticate, RolePermissions.AUTHENTICATED, validateBody(updateProfileSchema)],
      schema: {
        tags: ["Profile"],
        summary: "Update current user profile",
        description:
          "Partially update the authenticated user's profile. All fields are optional.",
        security: [{ bearerAuth: [] }],
        body: updateProfileBodyJson,
        response: {
          200: successResponse(profileResponseSchema),
        },
      },
    },
    (request, reply) =>
      controller.updateCurrentUserProfile(request as AuthenticatedRequest, reply),
  );

  fastify.get(
    "/users/me/profile/avatar/upload-token",
    {
      preHandler: [authenticate, RolePermissions.AUTHENTICATED],
      schema: {
        tags: ["Profile"],
        summary: "Issue an ImageKit avatar upload token",
        description:
          "Returns a signed, short-lived (5 min) ImageKit upload token scoped to the user's avatar folder.",
        security: [{ bearerAuth: [] }],
        response: {
          200: successResponse(avatarUploadTokenResponseSchema),
        },
      },
    },
    (req, reply) =>
      controller.getAvatarUploadToken(req as AuthenticatedRequest, reply),
  );

  // GET /users/me/sessions
  fastify.get(
    "/users/me/sessions",
    {
      preHandler: [authenticate, RolePermissions.AUTHENTICATED],
      schema: {
        tags: ["Profile"],
        summary: "Get active sessions",
        description: "List all active devices where the user is currently logged in.",
        security: [{ bearerAuth: [] }],
        response: {
          200: successResponse(activeSessionResponseSchema),
        },
      },
    },
    (req, reply) =>
      controller.getCurrentUserSessions(req as AuthenticatedRequest, reply),
  );

  // DELETE /users/me/sessions/:id
  fastify.delete(
    "/users/me/sessions/:id",
    {
      preHandler: [authenticate, RolePermissions.AUTHENTICATED],
      schema: {
        tags: ["Profile"],
        summary: "Revoke a session",
        description: "Revoke a specific active session by ID.",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          properties: {
            id: { type: "string" },
          },
          required: ["id"],
        },
        response: {
          200: actionSuccessResponse(),
        },
      },
    },
    (req, reply) =>
      controller.revokeCurrentUserSession(req as any, reply),
  );
}
