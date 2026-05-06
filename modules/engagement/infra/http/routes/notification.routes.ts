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
  paginatedResponse,
} from "@/api/src/shared/http/response-schemas";
import { NotificationController } from "../controllers/notification.controller";
import {
  validateBody,
  validateParams,
  validateQuery,
  toJsonSchema,
} from "../validation/validator";
import {
  notificationIdParamsSchema,
  notificationsByTypeQuerySchema,
  scheduleNotificationSchema,
  notificationResponseSchema,
} from "../validation/notification.schema";

// Pre-compute JSON Schemas from Zod (single source of truth — no drift).
const notificationIdParamsJson = toJsonSchema(notificationIdParamsSchema);
const notificationsByTypeQueryJson = toJsonSchema(notificationsByTypeQuerySchema);
const scheduleNotificationBodyJson = toJsonSchema(scheduleNotificationSchema);

const writeRateLimiter = createRateLimiter({
  ...RateLimitPresets.writeOperations,
  keyGenerator: userOrIpKeyGenerator,
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
      preHandler: [authenticate, RolePermissions.AUTHENTICATED],
      schema: {
        description: "Get a specific notification by ID",
        summary: "Get Notification",
        tags: ["Engagement - Notifications"],
        security: [{ bearerAuth: [] }],
        params: notificationIdParamsJson,
        response: {
          200: successResponse(notificationResponseSchema),
        },
      },
    },
    (request, reply) => controller.getNotification(request as AuthenticatedRequest, reply),
  );

  // GET /engagement/notifications — Get notifications by type
  fastify.get(
    "/engagement/notifications",
    {
      preValidation: [validateQuery(notificationsByTypeQuerySchema)],
      preHandler: [authenticate, RolePermissions.AUTHENTICATED],
      schema: {
        description: "Get notifications by type",
        summary: "Get User Notifications",
        tags: ["Engagement - Notifications"],
        security: [{ bearerAuth: [] }],
        querystring: notificationsByTypeQueryJson,
        response: {
          200: successResponse(paginatedResponse(notificationResponseSchema)),
        },
      },
    },
    (request, reply) => controller.getNotificationsByType(request as AuthenticatedRequest, reply),
  );

  // POST /engagement/notifications/schedule — Schedule notification (admin)
  fastify.post(
    "/engagement/notifications/schedule",
    {
      preValidation: [validateBody(scheduleNotificationSchema)],
      preHandler: [authenticate, RolePermissions.ADMIN_ONLY],
      schema: {
        description: "Schedule a notification",
        summary: "Schedule Notification",
        tags: ["Engagement - Notifications"],
        security: [{ bearerAuth: [] }],
        body: scheduleNotificationBodyJson,
        response: {
          201: successResponse(notificationResponseSchema, 201),
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
      preHandler: [authenticate, RolePermissions.ADMIN_ONLY],
      schema: {
        description: "Send a scheduled notification immediately",
        summary: "Send Notification",
        tags: ["Engagement - Notifications"],
        security: [{ bearerAuth: [] }],
        params: notificationIdParamsJson,
        response: { 
          200: actionSuccessResponse(),
        },
      },
    },
    (request, reply) => controller.sendNotification(request as AuthenticatedRequest, reply),
  );
}
