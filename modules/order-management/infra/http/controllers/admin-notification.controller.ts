import { FastifyReply } from "fastify";
import { PrismaClient } from "@prisma/client";
import { AuthenticatedRequest } from "@/api/src/shared/interfaces/authenticated-request.interface";
import { ResponseHelper } from "@/api/src/shared/response.helper";

export class AdminNotificationController {
  constructor(private readonly prisma: PrismaClient) {}

  async listNotifications(request: AuthenticatedRequest, reply: FastifyReply) {
    try {
      const notifications = await this.prisma.adminNotification.findMany({
        orderBy: { createdAt: "desc" },
        take: 50,
      });
      return ResponseHelper.ok(reply, "Notifications retrieved successfully", notifications);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async markNotificationRead(
    request: AuthenticatedRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const notification = await this.prisma.adminNotification.update({
        where: { id: request.params.id },
        data: { isRead: true },
      });
      return ResponseHelper.ok(reply, "Notification marked as read successfully", notification);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async markAllNotificationsRead(request: AuthenticatedRequest, reply: FastifyReply) {
    try {
      await this.prisma.adminNotification.updateMany({
        where: { isRead: false },
        data: { isRead: true },
      });
      return ResponseHelper.ok(reply, "All notifications marked as read successfully");
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }
}
