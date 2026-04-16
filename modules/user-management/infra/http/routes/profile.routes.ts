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
      preValidation: [validateBody(updateProfileSchema)],
      preHandler: [RolePermissions.AUTHENTICATED],
      schema: {
        tags: ["Profile"],
        summary: "Update current user profile",
        description:
          "Partially update the authenticated user's profile. All fields are optional.",
        security: [{ bearerAuth: [] }],
        body: {
          type: "object",
          properties: {
            firstName: { type: "string", maxLength: 100 },
            lastName: { type: "string", maxLength: 100 },
            displayName: { type: "string", maxLength: 100 },
            bio: { type: "string", maxLength: 500 },
            avatarUrl: { type: "string", format: "uri" },
            dateOfBirth: { type: "string" },
            gender: {
              type: "string",
              enum: ["male", "female", "non_binary", "prefer_not_to_say"],
            },
            locale: { type: "string", maxLength: 10 },
            currency: { type: "string", minLength: 3, maxLength: 3 },
            defaultAddressId: { type: "string", format: "uuid" },
            defaultPaymentMethodId: { type: "string", format: "uuid" },
            stylePreferences: { type: "object", additionalProperties: true },
            preferredSizes: { type: "object", additionalProperties: true },
          },
        },
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
