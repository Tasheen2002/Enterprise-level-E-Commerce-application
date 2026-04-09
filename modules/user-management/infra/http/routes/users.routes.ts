import { FastifyInstance } from "fastify";
import { UsersController } from "../controllers/users.controller";
import { AuthenticatedRequest } from "@/api/src/shared/interfaces/authenticated-request.interface";
import { authenticate, RolePermissions } from "@/api/src/shared/middleware";
import { validateBody, validateParams, validateQuery } from "../validation/validator";
import {
  userIdParamsSchema,
  listUsersQuerySchema,
  updateUserStatusSchema,
  updateUserRoleSchema,
  toggleEmailVerifiedSchema,
  userDetailResponseSchema,
  userListResponseSchema,
} from "../validation/user.schema";
import { profileResponseSchema } from "../validation/profile.schema";

export async function registerUserRoutes(
  fastify: FastifyInstance,
  controller: UsersController,
) {
  // GET /users/me — authenticated user's full profile
  fastify.get(
    "/users/me",
    {
      preHandler: [authenticate],
      schema: {
        tags: ["Users"],
        summary: "Get current user",
        description: "Returns the authenticated user's full profile.",
        security: [{ bearerAuth: [] }],
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: profileResponseSchema,
            },
          },
        },
      },
    },
    (request, reply) =>
      controller.getCurrentUser(request as AuthenticatedRequest, reply),
  );

  // GET /admin/users — Admin only
  fastify.get(
    "/admin/users",
    {
      preValidation: [validateQuery(listUsersQuerySchema)],
      preHandler: [RolePermissions.ADMIN_ONLY],
      schema: {
        tags: ["Users"],
        summary: "List all users",
        description: "Admin only. Retrieve a paginated list of all users.",
        security: [{ bearerAuth: [] }],
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: userListResponseSchema,
            },
          },
        },
      },
    },
    (request, reply) =>
      controller.listUsers(request as AuthenticatedRequest, reply),
  );

  // GET /users/:userId — Admin only
  fastify.get(
    "/users/:userId",
    {
      preValidation: [validateParams(userIdParamsSchema)],
      preHandler: [RolePermissions.ADMIN_ONLY],
      schema: {
        tags: ["Users"],
        summary: "Get user by ID",
        description:
          "Admin only. Retrieve any user's full details by their UUID.",
        security: [{ bearerAuth: [] }],
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: profileResponseSchema,
            },
          },
        },
      },
    },
    (request, reply) =>
      controller.getUser(request as AuthenticatedRequest, reply),
  );

  // PATCH /users/:userId/status — Admin only
  fastify.patch(
    "/users/:userId/status",
    {
      preValidation: [validateParams(userIdParamsSchema)],
      preHandler: [RolePermissions.ADMIN_ONLY, validateBody(updateUserStatusSchema)],
      schema: {
        tags: ["Users"],
        summary: "Update user status",
        description:
          "Admin only. Activate, deactivate, or block a user account.",
        security: [{ bearerAuth: [] }],
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: {
                type: "object",
                properties: {
                  userId: { type: "string" },
                  status: { type: "string" },
                },
              },
            },
          },
        },
      },
    },
    (request, reply) =>
      controller.updateStatus(request as AuthenticatedRequest, reply),
  );

  // PATCH /users/:userId/role — Admin only
  fastify.patch(
    "/users/:userId/role",
    {
      preValidation: [validateParams(userIdParamsSchema)],
      preHandler: [RolePermissions.ADMIN_ONLY, validateBody(updateUserRoleSchema)],
      schema: {
        tags: ["Users"],
        summary: "Update user role",
        description: "Admin only. Change a user's role.",
        security: [{ bearerAuth: [] }],
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: {
                type: "object",
                properties: {
                  userId: { type: "string" },
                  role: { type: "string" },
                },
              },
            },
          },
        },
      },
    },
    (request, reply) =>
      controller.updateRole(request as AuthenticatedRequest, reply),
  );

  // PATCH /users/:userId/email-verified — Admin only
  fastify.patch(
    "/users/:userId/email-verified",
    {
      preValidation: [validateParams(userIdParamsSchema)],
      preHandler: [RolePermissions.ADMIN_ONLY, validateBody(toggleEmailVerifiedSchema)],
      schema: {
        tags: ["Users"],
        summary: "Toggle email verification",
        description: "Admin only. Manually verify or unverify a user's email.",
        security: [{ bearerAuth: [] }],
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: { type: "object" },
            },
          },
        },
      },
    },
    (request, reply) =>
      controller.toggleEmailVerification(request as AuthenticatedRequest, reply),
  );

  // DELETE /users/:userId — Admin only
  fastify.delete(
    "/users/:userId",
    {
      preValidation: [validateParams(userIdParamsSchema)],
      preHandler: [RolePermissions.ADMIN_ONLY],
      schema: {
        tags: ["Users"],
        summary: "Delete a user",
        description: "Admin only. Permanently delete a user account.",
        security: [{ bearerAuth: [] }],
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              message: { type: "string" },
            },
          },
        },
      },
    },
    (request, reply) =>
      controller.deleteUser(request as AuthenticatedRequest, reply),
  );
}
