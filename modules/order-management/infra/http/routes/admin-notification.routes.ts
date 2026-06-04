import { FastifyInstance } from "fastify";
import { AuthenticatedRequest } from "@/api/src/shared/interfaces/authenticated-request.interface";
import { AdminNotificationController } from "../controllers/admin-notification.controller";
import { authenticate } from "@/api/src/shared/middleware/authenticate.middleware";
import { RolePermissions } from "@/api/src/shared/middleware/role-authorization.middleware";
import { validateParams, toJsonSchema } from "../validation/validator";
import { successResponse } from "@/api/src/shared/http/response-schemas";
import {
  notificationIdParamsSchema,
  listNotificationsResponseSchema,
  markNotificationReadResponseSchema,
  markAllNotificationsReadResponseSchema,
} from "../validation/admin-notification.schema";

const notificationIdParamsJson = toJsonSchema(notificationIdParamsSchema);

export async function registerAdminNotificationRoutes(
  fastify: FastifyInstance,
  adminNotificationController: AdminNotificationController,
): Promise<void> {
  // List all admin notifications (Staff/Admin only)
  fastify.get(
    "/notifications",
    {
      preHandler: [authenticate, RolePermissions.STAFF_LEVEL],
      schema: {
        description: "Get recent administrative audit notifications (Staff/Admin only)",
        tags: ["Notifications"],
        summary: "List Notifications",
        security: [{ bearerAuth: [] }],
        response: {
          200: successResponse(listNotificationsResponseSchema),
        },
      },
    },
    (request, reply) =>
      adminNotificationController.listNotifications(request as AuthenticatedRequest, reply),
  );

  // Mark a single notification as read (Staff/Admin only)
  fastify.patch(
    "/notifications/:id/read",
    {
      preValidation: [validateParams(notificationIdParamsSchema)],
      preHandler: [authenticate, RolePermissions.STAFF_LEVEL],
      schema: {
        description: "Mark a specific notification as read (Staff/Admin only)",
        tags: ["Notifications"],
        summary: "Mark Notification as Read",
        security: [{ bearerAuth: [] }],
        params: notificationIdParamsJson,
        response: {
          200: successResponse(markNotificationReadResponseSchema),
        },
      },
    },
    (request, reply) =>
      adminNotificationController.markNotificationRead(
        request as AuthenticatedRequest<{ Params: { id: string } }>,
        reply,
      ),
  );

  // Mark all notifications as read (Staff/Admin only)
  fastify.post(
    "/notifications/read-all",
    {
      preHandler: [authenticate, RolePermissions.STAFF_LEVEL],
      schema: {
        description: "Mark all unread administrative notifications as read (Staff/Admin only)",
        tags: ["Notifications"],
        summary: "Mark All Notifications as Read",
        security: [{ bearerAuth: [] }],
        response: {
          200: successResponse(markAllNotificationsReadResponseSchema),
        },
      },
    },
    (request, reply) =>
      adminNotificationController.markAllNotificationsRead(request as AuthenticatedRequest, reply),
  );
}
