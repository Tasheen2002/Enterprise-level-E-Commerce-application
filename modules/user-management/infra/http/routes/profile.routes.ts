import { FastifyInstance } from "fastify";
import { ProfileController } from "../controllers/profile.controller";
import { authenticate } from "@/api/src/shared/middleware";

const profileData = {
  type: "object",
  properties: {
    userId: { type: "string", format: "uuid" },
    firstName: { type: "string" },
    lastName: { type: "string" },
    displayName: { type: "string" },
    bio: { type: "string" },
    avatarUrl: { type: "string", format: "uri" },
    dateOfBirth: { type: "string" },
    gender: { type: "string" },
    locale: { type: "string" },
    currency: { type: "string" },
    defaultAddressId: { type: "string", format: "uuid" },
    defaultPaymentMethodId: { type: "string", format: "uuid" },
    stylePreferences: { type: "object" },
    preferredSizes: {
      type: "object",
      properties: {
        shoes: { type: "string" },
        clothing: { type: "string" },
      },
    },
  },
};

const profileBodyProperties = {
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
  stylePreferences: { type: "object" },
  preferredSizes: {
    type: "object",
    properties: {
      shoes: { type: "string" },
      clothing: { type: "string" },
    },
  },
};

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
              data: profileData,
            },
          },
        },
      },
    },
    (request, reply) => controller.getProfile(request as any, reply),
  );

  // PATCH /users/me/profile
  fastify.patch(
    "/users/me/profile",
    {
      preHandler: [authenticate],
      schema: {
        tags: ["Profile"],
        summary: "Update current user profile",
        description:
          "Partially update the authenticated user's profile. All fields are optional.",
        security: [{ bearerAuth: [] }],
        body: {
          type: "object",
          properties: profileBodyProperties,
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              statusCode: { type: "number" },
              message: { type: "string" },
              data: profileData,
            },
          },
        },
      },
    },
    (request, reply) => controller.updateProfile(request as any, reply),
  );
}
