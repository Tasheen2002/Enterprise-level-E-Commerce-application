import { FastifyReply } from "fastify";
import { AuthenticatedRequest } from "@/api/src/shared/interfaces/authenticated-request.interface";
import { ResponseHelper } from "@/api/src/shared/response.helper";
import {
  ScheduleNotificationHandler,
  SendNotificationHandler,
  GetNotificationHandler,
  GetNotificationsByTypeHandler,
} from "../../../application";
import {
  ScheduleNotificationBody,
  NotificationIdParams,
  NotificationsByTypeQuery,
} from "../validation/notification.schema";

export class NotificationController {
  constructor(
    private readonly scheduleNotificationHandler: ScheduleNotificationHandler,
    private readonly sendNotificationHandler: SendNotificationHandler,
    private readonly getNotificationHandler: GetNotificationHandler,
    private readonly getNotificationsByTypeHandler: GetNotificationsByTypeHandler,
  ) {}

  async scheduleNotification(
    request: AuthenticatedRequest<{ Body: ScheduleNotificationBody }>,
    reply: FastifyReply,
  ) {
    try {
      const { type, channel, templateId, payload, scheduledAt } = request.body;
      const result = await this.scheduleNotificationHandler.handle({
        type,
        channel,
        templateId,
        payload,
        scheduledAt,
      });
      return ResponseHelper.fromCommand(reply, result, "Notification scheduled successfully", 201);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async sendNotification(
    request: AuthenticatedRequest<{ Params: NotificationIdParams }>,
    reply: FastifyReply,
  ) {
    try {
      const result = await this.sendNotificationHandler.handle({
        notificationId: request.params.notificationId,
      });
      return ResponseHelper.fromCommand(reply, result, "Notification sent successfully");
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async getNotification(
    request: AuthenticatedRequest<{ Params: NotificationIdParams }>,
    reply: FastifyReply,
  ) {
    try {
      const dto = await this.getNotificationHandler.handle({
        notificationId: request.params.notificationId,
      });
      return ResponseHelper.ok(reply, "Notification retrieved successfully", dto);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async getNotificationsByType(
    request: AuthenticatedRequest<{ Querystring: NotificationsByTypeQuery }>,
    reply: FastifyReply,
  ) {
    try {
      const { type, limit, offset } = request.query;
      const result = await this.getNotificationsByTypeHandler.handle({ type, limit, offset });
      return ResponseHelper.ok(reply, "Notifications retrieved successfully", result);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }
}
