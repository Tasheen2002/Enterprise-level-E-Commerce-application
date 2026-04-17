import { FastifyInstance } from "fastify";
import { AuthenticatedRequest } from "@/api/src/shared/interfaces/authenticated-request.interface";
import { RolePermissions } from "@/api/src/shared/middleware/role-authorization.middleware";
import {
  createRateLimiter,
  RateLimitPresets,
  userKeyGenerator,
} from "@/api/src/shared/middleware/rate-limiter.middleware";
import { NotificationController } from "../controllers/notification.controller";
import { validateBody, validateParams, validateQuery } from "../validation/validator";
import {
  notificationIdParamsSchema,
  notificationsByTypeQuerySchema,
  scheduleNotificationSchema,
  notificationResponseSchema,
} from "../validation/notification.schema";

const writeRateLimiter = createRateLimiter({
  ...RateLimitPresets.writeOperations,
  keyGenerator: userKeyGenerator,
});

export async function notificationRoutes(
  fastify: FastifyInstance,
  controller: NotificationController,
): Promise<void> {
  fastify.addHook("onRequest", async (request, reply) => {
    if (request.method !== "GET") {
      await writeRateLimiter(request, reply);
    }
  });

  // GET /engagement/notifications/:notificationId — Get notification
  fastify.get(
    "/engagement/notifications/:notificationId",
    {
      preValidation: [validateParams(notificationIdParamsSchema)],
      preHandler: [RolePermissions.AUTHENTICATED],
      schema: {
        description: "Get a specific notification by ID",
        summary: "Get Notification",
        tags: ["Engagement - Notifications"],
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["notificationId"],
          properties: {
            notificationId: { type: "string", format: "uuid" },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: notificationResponseSchema,
            },
          },
        },
      },
    },
    (request, reply) => controller.getNotification(request as AuthenticatedRequest, reply),
  );

  // GET /engagement/notifications — Get user notifications by type
  fastify.get(
    "/engagement/notifications",
    {
      preValidation: [validateQuery(notificationsByTypeQuerySchema)],
      preHandler: [RolePermissions.AUTHENTICATED],
      schema: {
        description: "Get notifications by type",
        summary: "Get User Notifications",
        tags: ["Engagement - Notifications"],
        security: [{ bearerAuth: [] }],
        querystring: {
          type: "object",
          required: ["type"],
          properties: {
            type: {
              type: "string",
              enum: ["order_confirm", "shipped", "restock", "review_request", "care_guide", "promo"],
            },
            limit: { type: "integer", minimum: 1 },
            offset: { type: "integer", minimum: 0 },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: { type: "array", items: notificationResponseSchema },
              total: { type: "number" },
            },
          },
        },
      },
    },
    (request, reply) => controller.getUserNotifications(request as AuthenticatedRequest, reply),
  );

  // POST /engagement/notifications/schedule — Schedule notification (admin)
  fastify.post(
    "/engagement/notifications/schedule",
    {
      preValidation: [validateBody(scheduleNotificationSchema)],
      preHandler: [RolePermissions.ADMIN_ONLY],
      schema: {
        description: "Schedule a notification",
        summary: "Schedule Notification",
        tags: ["Engagement - Notifications"],
        security: [{ bearerAuth: [] }],
        body: {
          type: "object",
          required: ["type", "scheduledAt"],
          properties: {
            type: {
              type: "string",
              enum: ["order_confirm", "shipped", "restock", "review_request", "care_guide", "promo"],
            },
            channel: { type: "string", enum: ["email", "sms", "push", "in_app"] },
            templateId: { type: "string" },
            payload: { type: "object", additionalProperties: true },
            scheduledAt: { type: "string", format: "date-time" },
          },
        },
        response: {
          201: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: notificationResponseSchema,
              message: { type: "string" },
            },
          },
        },
      },
    },
    (request, reply) => controller.scheduleNotification(request as AuthenticatedRequest, reply),
  );

  // POST /engagement/notifications/:notificationId/send — Send notification (admin)
  fastify.post(
    "/engagement/notifications/:notificationId/send",
    {
      preValidation: [validateParams(notificationIdParamsSchema)],
      preHandler: [RolePermissions.ADMIN_ONLY],
      schema: {
        description: "Send a scheduled notification immediately",
        summary: "Send Notification",
        tags: ["Engagement - Notifications"],
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["notificationId"],
          properties: {
            notificationId: { type: "string", format: "uuid" },
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
    (request, reply) => controller.sendNotification(request as AuthenticatedRequest, reply),
  );
}
