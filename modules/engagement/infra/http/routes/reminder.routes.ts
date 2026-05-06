import { FastifyInstance } from "fastify";
import { AuthenticatedRequest } from "@/api/src/shared/interfaces/authenticated-request.interface";
import { RolePermissions } from "@/api/src/shared/middleware/role-authorization.middleware";
import { authenticate } from "@/api/src/shared/middleware/authenticate.middleware";
import {
  createRateLimiter,
  RateLimitPresets,
  userOrIpKeyGenerator,
} from "@/api/src/shared/middleware/rate-limiter.middleware";
import {
  successResponse,
  actionSuccessResponse,
  noContentResponse,
  paginatedResponse,
} from "@/api/src/shared/http/response-schemas";
import { ReminderController } from "../controllers/reminder.controller";
import {
  validateBody,
  validateParams,
  validateQuery,
  toJsonSchema,
} from "../validation/validator";
import {
  reminderIdParamsSchema,
  userIdParamsSchema,
  variantIdParamsSchema,
  paginationQuerySchema,
  createReminderSchema,
  reminderResponseSchema,
} from "../validation/reminder.schema";

// Pre-compute JSON Schemas from Zod (single source of truth — no drift).
const reminderIdParamsJson = toJsonSchema(reminderIdParamsSchema);
const userIdParamsJson = toJsonSchema(userIdParamsSchema);
const variantIdParamsJson = toJsonSchema(variantIdParamsSchema);
const paginationQueryJson = toJsonSchema(paginationQuerySchema);
const createReminderBodyJson = toJsonSchema(createReminderSchema);

const writeRateLimiter = createRateLimiter({
  ...RateLimitPresets.writeOperations,
  keyGenerator: userOrIpKeyGenerator,
});

export async function reminderRoutes(
  fastify: FastifyInstance,
  controller: ReminderController,
): Promise<void> {
  fastify.addHook("onRequest", async (request, reply) => {
    if (request.method !== "GET") {
      await writeRateLimiter(request, reply);
    }
  });

  // GET /engagement/reminders/:reminderId — Get reminder
  fastify.get(
    "/engagement/reminders/:reminderId",
    {
      preValidation: [validateParams(reminderIdParamsSchema)],
      preHandler: [authenticate, RolePermissions.AUTHENTICATED],
      schema: {
        description: "Get a specific reminder by ID",
        summary: "Get Reminder",
        tags: ["Engagement - Reminders"],
        security: [{ bearerAuth: [] }],
        params: reminderIdParamsJson,
        response: {
          200: successResponse(reminderResponseSchema),
        },
      },
    },
    (request, reply) =>
      controller.getReminder(request as AuthenticatedRequest, reply),
  );

  // GET /engagement/users/:userId/reminders — Get user reminders
  fastify.get(
    "/engagement/users/:userId/reminders",
    {
      preValidation: [
        validateParams(userIdParamsSchema),
        validateQuery(paginationQuerySchema),
      ],
      preHandler: [authenticate, RolePermissions.AUTHENTICATED],
      schema: {
        description: "Get all reminders for a specific user",
        summary: "Get User Reminders",
        tags: ["Engagement - Reminders"],
        security: [{ bearerAuth: [] }],
        params: userIdParamsJson,
        querystring: paginationQueryJson,
        response: {
          200: successResponse(paginatedResponse(reminderResponseSchema)),
        },
      },
    },
    (request, reply) =>
      controller.getUserReminders(request as AuthenticatedRequest, reply),
  );

  // GET /engagement/variants/:variantId/reminders — Get variant reminders (admin)
  fastify.get(
    "/engagement/variants/:variantId/reminders",
    {
      preValidation: [
        validateParams(variantIdParamsSchema),
        validateQuery(paginationQuerySchema),
      ],
      preHandler: [authenticate, RolePermissions.ADMIN_ONLY],
      schema: {
        description: "Get all reminders for a specific product variant",
        summary: "Get Variant Reminders",
        tags: ["Engagement - Reminders"],
        security: [{ bearerAuth: [] }],
        params: variantIdParamsJson,
        querystring: paginationQueryJson,
        response: {
          200: successResponse(paginatedResponse(reminderResponseSchema)),
        },
      },
    },
    (request, reply) =>
      controller.getVariantReminders(request as AuthenticatedRequest, reply),
  );

  // POST /engagement/reminders — Create reminder
  fastify.post(
    "/engagement/reminders",
    {
      preValidation: [validateBody(createReminderSchema)],
      preHandler: [authenticate, RolePermissions.AUTHENTICATED],
      schema: {
        description: "Create a new product reminder",
        summary: "Create Reminder",
        tags: ["Engagement - Reminders"],
        security: [{ bearerAuth: [] }],
        body: createReminderBodyJson,
        response: {
          201: successResponse(reminderResponseSchema, 201),
        },
      },
    },
    (request, reply) =>
      controller.createReminder(request as AuthenticatedRequest, reply),
  );

  // POST /engagement/reminders/:reminderId/unsubscribe — Unsubscribe from reminder
  fastify.post(
    "/engagement/reminders/:reminderId/unsubscribe",
    {
      preValidation: [validateParams(reminderIdParamsSchema)],
      preHandler: [authenticate, RolePermissions.AUTHENTICATED],
      schema: {
        description: "Unsubscribe from a reminder",
        summary: "Unsubscribe Reminder",
        tags: ["Engagement - Reminders"],
        security: [{ bearerAuth: [] }],
        params: reminderIdParamsJson,
        response: {
          200: actionSuccessResponse(),
        },
      },
    },
    (request, reply) =>
      controller.unsubscribeReminder(request as AuthenticatedRequest, reply),
  );

  // PATCH /engagement/reminders/:reminderId/sent — Mark reminder as sent (admin)
  fastify.patch(
    "/engagement/reminders/:reminderId/sent",
    {
      preValidation: [validateParams(reminderIdParamsSchema)],
      preHandler: [authenticate, RolePermissions.ADMIN_ONLY],
      schema: {
        description: "Mark reminder as sent",
        summary: "Mark Reminder As Sent",
        tags: ["Engagement - Reminders"],
        security: [{ bearerAuth: [] }],
        params: reminderIdParamsJson,
        response: {
          200: actionSuccessResponse(),
        },
      },
    },
    (request, reply) =>
      controller.markReminderAsSent(request as AuthenticatedRequest, reply),
  );

  // DELETE /engagement/reminders/:reminderId — Delete reminder
  fastify.delete(
    "/engagement/reminders/:reminderId",
    {
      preValidation: [validateParams(reminderIdParamsSchema)],
      preHandler: [authenticate, RolePermissions.AUTHENTICATED],
      schema: {
        description: "Delete a reminder",
        summary: "Delete Reminder",
        tags: ["Engagement - Reminders"],
        security: [{ bearerAuth: [] }],
        params: reminderIdParamsJson,
        response: {
          204: noContentResponse,
        },
      },
    },
    (request, reply) =>
      controller.deleteReminder(request as AuthenticatedRequest, reply),
  );
}
