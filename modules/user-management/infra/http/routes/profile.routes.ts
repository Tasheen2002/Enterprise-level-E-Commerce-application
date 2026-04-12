import { FastifyInstance } from "fastify";
import { ProfileController } from "../controllers/profile.controller";
import { AuthenticatedRequest } from "@/api/src/shared/interfaces/authenticated-request.interface";
import { RolePermissions } from "@/api/src/shared/middleware/role-authorization.middleware";
import {
  createRateLimiter,
  RateLimitPresets,
  userKeyGenerator,
} from "@/api/src/shared/middleware/rate-limiter.middleware";
import { validateBody } from "../validation/validator";
import {
  updateProfileSchema,
  profileResponseSchema,
} from "../validation/profile.schema";

const writeRateLimiter = createRateLimiter({
  ...RateLimitPresets.writeOperations,
  keyGenerator: userKeyGenerator,
});


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
      preHandler: [RolePermissions.AUTHENTICATED],
      schema: {
        tags: ["Profile"],
        summary: "Get current user profile",
        description:
          "Retrieve the authenticated user's full profile including preferences and sizes.",
        security: [{ bearerAuth: [] }],
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              statusCode: { type: "number" },
              message: { type: "string" },
              data: profileResponseSchema,
            },
          },
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
      preHandler: [RolePermissions.AUTHENTICATED, validateBody(updateProfileSchema)],
      schema: {
        tags: ["Profile"],
        summary: "Update current user profile",
        description:
          "Partially update the authenticated user's profile. All fields are optional.",
        security: [{ bearerAuth: [] }],
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              statusCode: { type: "number" },
              message: { type: "string" },
              data: profileResponseSchema,
            },
          },
        },
      },
    },
    (request, reply) =>
      controller.updateCurrentUserProfile(request as AuthenticatedRequest, reply),
  );
}
