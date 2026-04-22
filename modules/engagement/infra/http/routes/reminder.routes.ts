import { FastifyInstance } from "fastify";
import { AuthenticatedRequest } from "@/api/src/shared/interfaces/authenticated-request.interface";
import { RolePermissions } from "@/api/src/shared/middleware/role-authorization.middleware";
import {
  createRateLimiter,
  RateLimitPresets,
  userKeyGenerator,
} from "@/api/src/shared/middleware/rate-limiter.middleware";
import { ReminderController } from "../controllers/reminder.controller";
import {
  validateBody,
  validateParams,
  validateQuery,
} from "../validation/validator";
import {
  reminderIdParamsSchema,
  userIdParamsSchema,
  variantIdParamsSchema,
  paginationQuerySchema,
  createReminderSchema,
  reminderResponseSchema,
} from "../validation/reminder.schema";

const writeRateLimiter = createRateLimiter({
  ...RateLimitPresets.writeOperations,
  keyGenerator: userKeyGenerator,
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
      preHandler: [RolePermissions.AUTHENTICATED],
      schema: {
        description: "Get a specific reminder by ID",
        summary: "Get Reminder",
        tags: ["Engagement - Reminders"],
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["reminderId"],
          properties: {
            reminderId: { type: "string", format: "uuid" },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: reminderResponseSchema,
            },
          },
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
      preHandler: [RolePermissions.AUTHENTICATED],
      schema: {
        description: "Get all reminders for a specific user",
        summary: "Get User Reminders",
        tags: ["Engagement - Reminders"],
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["userId"],
          properties: {
            userId: { type: "string", format: "uuid" },
          },
        },
        querystring: {
          type: "object",
          properties: {
            limit: { type: "integer", minimum: 1 },
            offset: { type: "integer", minimum: 0 },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: { type: "array", items: reminderResponseSchema },
              total: { type: "number" },
            },
          },
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
      preHandler: [RolePermissions.ADMIN_ONLY],
      schema: {
        description: "Get all reminders for a specific product variant",
        summary: "Get Variant Reminders",
        tags: ["Engagement - Reminders"],
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["variantId"],
          properties: {
            variantId: { type: "string", format: "uuid" },
          },
        },
        querystring: {
          type: "object",
          properties: {
            limit: { type: "integer", minimum: 1 },
            offset: { type: "integer", minimum: 0 },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: { type: "array", items: reminderResponseSchema },
              total: { type: "number" },
            },
          },
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
      preHandler: [RolePermissions.AUTHENTICATED],
      schema: {
        description: "Create a new product reminder",
        summary: "Create Reminder",
        tags: ["Engagement - Reminders"],
        security: [{ bearerAuth: [] }],
        body: {
          type: "object",
          required: ["variantId", "type", "contact", "channel"],
          properties: {
            variantId: { type: "string", format: "uuid" },
            type: {
              type: "string",
              enum: ["back_in_stock", "price_drop", "low_stock"],
            },
            contact: { type: "string", enum: ["email", "phone"] },
            channel: {
              type: "string",
              enum: ["email", "sms", "push", "whatsapp"],
            },
            optInAt: { type: "string", format: "date-time" },
          },
        },
        response: {
          201: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: reminderResponseSchema,
              message: { type: "string" },
            },
          },
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
      preHandler: [RolePermissions.AUTHENTICATED],
      schema: {
        description: "Unsubscribe from a reminder",
        summary: "Unsubscribe Reminder",
        tags: ["Engagement - Reminders"],
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["reminderId"],
          properties: {
            reminderId: { type: "string", format: "uuid" },
          },
        },
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
      controller.unsubscribeReminder(request as AuthenticatedRequest, reply),
  );

  // PATCH /engagement/reminders/:reminderId/sent — Mark reminder as sent (admin)
  fastify.patch(
    "/engagement/reminders/:reminderId/sent",
    {
      preValidation: [validateParams(reminderIdParamsSchema)],
      preHandler: [RolePermissions.ADMIN_ONLY],
      schema: {
        description: "Mark reminder as sent",
        summary: "Mark Reminder As Sent",
        tags: ["Engagement - Reminders"],
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["reminderId"],
          properties: {
            reminderId: { type: "string", format: "uuid" },
          },
        },
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
      controller.markReminderAsSent(request as AuthenticatedRequest, reply),
  );

  // DELETE /engagement/reminders/:reminderId — Delete reminder
  fastify.delete(
    "/engagement/reminders/:reminderId",
    {
      preValidation: [validateParams(reminderIdParamsSchema)],
      preHandler: [RolePermissions.AUTHENTICATED],
      schema: {
        description: "Delete a reminder",
        summary: "Delete Reminder",
        tags: ["Engagement - Reminders"],
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["reminderId"],
          properties: {
            reminderId: { type: "string", format: "uuid" },
          },
        },
        response: {
          204: { description: "Reminder deleted successfully", type: "null" },
        },
      },
    },
    (request, reply) =>
      controller.deleteReminder(request as AuthenticatedRequest, reply),
  );
}
