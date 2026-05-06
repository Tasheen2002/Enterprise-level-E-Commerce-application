import { FastifyInstance } from "fastify";
import { UsersController } from "../controllers/users.controller";
import { AuthenticatedRequest } from "@/api/src/shared/interfaces/authenticated-request.interface";
import { RolePermissions } from "@/api/src/shared/middleware/role-authorization.middleware";
import { authenticate } from "@/api/src/shared/middleware/authenticate.middleware";
import {
  createRateLimiter,
  RateLimitPresets,
  userKeyGenerator,
} from "@/api/src/shared/middleware/rate-limiter.middleware";
import {
  validateBody,
  validateParams,
  validateQuery,
  toJsonSchema,
} from "../validation/validator";
import {
  successResponse,
  noContentResponse,
} from "@/api/src/shared/http/response-schemas";
import {
  userIdParamsSchema,
  listUsersQuerySchema,
  updateUserStatusSchema,
  updateUserRoleSchema,
  toggleEmailVerifiedSchema,
  userDetailResponseSchema,
  userListResponseSchema,
  userStatusUpdateResponseSchema,
  userRoleUpdateResponseSchema,
  userEmailVerifiedResponseSchema,
} from "../validation/user.schema";
import { profileResponseSchema } from "../validation/profile.schema";

const writeRateLimiter = createRateLimiter({
  ...RateLimitPresets.writeOperations,
  keyGenerator: userKeyGenerator,
});

// Pre-compute JSON Schemas from Zod (single source of truth — no drift).
const userIdParamsJson = toJsonSchema(userIdParamsSchema);
const listUsersQueryJson = toJsonSchema(listUsersQuerySchema);
const updateUserStatusBodyJson = toJsonSchema(updateUserStatusSchema);
const updateUserRoleBodyJson = toJsonSchema(updateUserRoleSchema);
const toggleEmailVerifiedBodyJson = toJsonSchema(toggleEmailVerifiedSchema);

export async function userRoutes(
  fastify: FastifyInstance,
  controller: UsersController,
) {
  fastify.addHook("onRequest", async (request, reply) => {
    if (request.method !== "GET") {
      await writeRateLimiter(request, reply);
    }
  });

  // GET /users/me — authenticated user's full profile
  fastify.get(
    "/users/me",
    {
      preHandler: [authenticate, RolePermissions.AUTHENTICATED],
      schema: {
        tags: ["Users"],
        summary: "Get current user",
        description: "Returns the authenticated user's full profile.",
        security: [{ bearerAuth: [] }],
        response: {
          200: successResponse(profileResponseSchema),
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
      preHandler: [authenticate, RolePermissions.ADMIN_ONLY],
      schema: {
        tags: ["Users"],
        summary: "List all users",
        description: "Admin only. Retrieve a paginated list of all users.",
        security: [{ bearerAuth: [] }],
        querystring: listUsersQueryJson,
        response: {
          200: successResponse(userListResponseSchema),
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
      preHandler: [authenticate, RolePermissions.ADMIN_ONLY],
      schema: {
        tags: ["Users"],
        summary: "Get user by ID",
        description:
          "Admin only. Retrieve any user's full details by their UUID.",
        security: [{ bearerAuth: [] }],
        params: userIdParamsJson,
        response: {
          200: successResponse(userDetailResponseSchema),
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
      preHandler: [authenticate, RolePermissions.ADMIN_ONLY, validateBody(updateUserStatusSchema)],
      schema: {
        tags: ["Users"],
        summary: "Update user status",
        description:
          "Admin only. Activate, deactivate, or block a user account.",
        security: [{ bearerAuth: [] }],
        params: userIdParamsJson,
        body: updateUserStatusBodyJson,
        response: {
          200: successResponse(userStatusUpdateResponseSchema),
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
      preHandler: [authenticate, RolePermissions.ADMIN_ONLY, validateBody(updateUserRoleSchema)],
      schema: {
        tags: ["Users"],
        summary: "Update user role",
        description: "Admin only. Change a user's role.",
        security: [{ bearerAuth: [] }],
        params: userIdParamsJson,
        body: updateUserRoleBodyJson,
        response: {
          200: successResponse(userRoleUpdateResponseSchema),
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
      preHandler: [authenticate, RolePermissions.ADMIN_ONLY, validateBody(toggleEmailVerifiedSchema)],
      schema: {
        tags: ["Users"],
        summary: "Toggle email verification",
        description: "Admin only. Manually verify or unverify a user's email.",
        security: [{ bearerAuth: [] }],
        params: userIdParamsJson,
        body: toggleEmailVerifiedBodyJson,
        response: {
          200: successResponse(userEmailVerifiedResponseSchema),
        },
      },
    },
    (request, reply) =>
      controller.toggleEmailVerification(
        request as AuthenticatedRequest,
        reply,
      ),
  );

  // DELETE /users/:userId — Admin only
  fastify.delete(
    "/users/:userId",
    {
      preValidation: [validateParams(userIdParamsSchema)],
      preHandler: [authenticate, RolePermissions.ADMIN_ONLY],
      schema: {
        tags: ["Users"],
        summary: "Delete a user",
        description: "Admin only. Permanently delete a user account.",
        security: [{ bearerAuth: [] }],
        params: userIdParamsJson,
        response: {
          204: noContentResponse,
        },
      },
    },
    (request, reply) =>
      controller.deleteUser(request as AuthenticatedRequest, reply),
  );
}
