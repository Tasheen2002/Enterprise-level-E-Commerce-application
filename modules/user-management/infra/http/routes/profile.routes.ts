import { FastifyInstance } from "fastify";
import { ProfileController } from "../controllers/profile.controller";
import { AuthenticatedRequest } from "@/api/src/shared/interfaces/authenticated-request.interface";
import { authenticate } from "@/api/src/shared/middleware";
import { validateBody } from "../validation/validator";
import {
  updateProfileSchema,
  profileResponseSchema,
} from "../validation/profile.schema";

export async function registerProfileRoutes(
  fastify: FastifyInstance,
  controller: ProfileController,
) {
  // GET /users/me/profile
  fastify.get(
    "/users/me/profile",
    {
      preHandler: [authenticate],
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
      preHandler: [authenticate, validateBody(updateProfileSchema)],
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
