import { FastifyInstance } from "fastify";
import {
  UsersController,
  ListUsersQuerystring,
  UpdateUserStatusBody,
  UpdateUserRoleBody,
  ToggleEmailVerifiedBody,
} from "../controllers/users.controller";
import { authenticate, RolePermissions } from "@/api/src/shared/middleware";

const userIdParam = {
  type: "object",
  required: ["userId"],
  properties: {
    userId: { type: "string", format: "uuid" },
  },
};

const userProfileData = {
  type: "object",
  properties: {
    userId: { type: "string", format: "uuid" },
    firstName: { type: "string" },
    lastName: { type: "string" },
    displayName: { type: "string" },
    bio: { type: "string" },
    avatarUrl: { type: "string", format: "uri" },
    locale: { type: "string" },
    currency: { type: "string" },
    createdAt: { type: "string" },
    updatedAt: { type: "string" },
  },
};

const userListItem = {
  type: "object",
  properties: {
    id: { type: "string", format: "uuid" },
    email: { type: "string", format: "email" },
    role: { type: "string" },
    status: { type: "string" },
    emailVerified: { type: "boolean" },
    createdAt: { type: "string" },
    updatedAt: { type: "string" },
  },
};

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
              data: userProfileData,
            },
          },
        },
      },
    },
    controller.getCurrentUser.bind(controller),
  );

  // GET /admin/users — Admin only
  fastify.get<{ Querystring: ListUsersQuerystring }>(
    "/admin/users",
    {
      preHandler: [RolePermissions.ADMIN_ONLY],
      schema: {
        tags: ["Users"],
        summary: "List all users",
        description: "Admin only. Retrieve a paginated list of all users.",
        security: [{ bearerAuth: [] }],
        querystring: {
          type: "object",
          properties: {
            page: { type: "integer", minimum: 1 },
            limit: { type: "integer", minimum: 1, maximum: 100 },
            role: { type: "string" },
            status: { type: "string" },
            search: { type: "string" },
            emailVerified: { type: "string", enum: ["true", "false"] },
            sortBy: { type: "string", enum: ["createdAt", "email"] },
            sortOrder: { type: "string", enum: ["asc", "desc"] },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: {
                type: "object",
                properties: {
                  users: { type: "array", items: userListItem },
                  pagination: {
                    type: "object",
                    properties: {
                      page: { type: "number" },
                      limit: { type: "number" },
                      total: { type: "number" },
                      totalPages: { type: "number" },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    controller.listUsers.bind(controller),
  );

  // GET /users/:userId — Admin only
  fastify.get<{ Params: { userId: string } }>(
    "/users/:userId",
    {
      preHandler: [RolePermissions.ADMIN_ONLY],
      schema: {
        tags: ["Users"],
        summary: "Get user by ID",
        description:
          "Admin only. Retrieve any user's full details by their UUID.",
        security: [{ bearerAuth: [] }],
        params: userIdParam,
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: userProfileData,
            },
          },
        },
      },
    },
    controller.getUser.bind(controller),
  );

  // PATCH /users/:userId/status — Admin only
  fastify.patch<{
    Params: { userId: string };
    Body: UpdateUserStatusBody;
  }>(
    "/users/:userId/status",
    {
      preHandler: [RolePermissions.ADMIN_ONLY],
      schema: {
        tags: ["Users"],
        summary: "Update user status",
        description:
          "Admin only. Activate, deactivate, or block a user account.",
        security: [{ bearerAuth: [] }],
        params: userIdParam,
        body: {
          type: "object",
          required: ["status"],
          properties: {
            status: { type: "string", enum: ["active", "inactive", "blocked"] },
            notes: { type: "string" },
          },
        },
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
    controller.updateStatus.bind(controller),
  );

  // PATCH /users/:userId/role — Admin only
  fastify.patch<{
    Params: { userId: string };
    Body: UpdateUserRoleBody;
  }>(
    "/users/:userId/role",
    {
      preHandler: [RolePermissions.ADMIN_ONLY],
      schema: {
        tags: ["Users"],
        summary: "Update user role",
        description: "Admin only. Change a user's role.",
        security: [{ bearerAuth: [] }],
        params: userIdParam,
        body: {
          type: "object",
          required: ["role"],
          properties: {
            role: {
              type: "string",
              enum: [
                "GUEST",
                "CUSTOMER",
                "ADMIN",
                "INVENTORY_STAFF",
                "CUSTOMER_SERVICE",
                "ANALYST",
                "VENDOR",
              ],
            },
            reason: { type: "string" },
          },
        },
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
    controller.updateRole.bind(controller),
  );

  // PATCH /users/:userId/email-verified — Admin only
  fastify.patch<{
    Params: { userId: string };
    Body: ToggleEmailVerifiedBody;
  }>(
    "/users/:userId/email-verified",
    {
      preHandler: [RolePermissions.ADMIN_ONLY],
      schema: {
        tags: ["Users"],
        summary: "Toggle email verification",
        description: "Admin only. Manually verify or unverify a user's email.",
        security: [{ bearerAuth: [] }],
        params: userIdParam,
        body: {
          type: "object",
          required: ["isVerified"],
          properties: {
            isVerified: { type: "boolean" },
            reason: { type: "string" },
          },
        },
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
    controller.toggleEmailVerification.bind(controller),
  );

  // DELETE /users/:userId — Admin only
  fastify.delete<{ Params: { userId: string } }>(
    "/users/:userId",
    {
      preHandler: [RolePermissions.ADMIN_ONLY],
      schema: {
        tags: ["Users"],
        summary: "Delete a user",
        description: "Admin only. Permanently delete a user account.",
        security: [{ bearerAuth: [] }],
        params: userIdParam,
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
    controller.deleteUser.bind(controller),
  );
}
