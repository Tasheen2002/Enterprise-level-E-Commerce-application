import { FastifyRequest, FastifyReply } from "fastify";
import {
  ScheduleNotificationCommand,
  ScheduleNotificationHandler,
  SendNotificationCommand,
  SendNotificationHandler,
} from "../../../application/commands/index.js";
import {
  GetNotificationQuery,
  GetNotificationHandler,
  GetUserNotificationsQuery,
  GetUserNotificationsHandler,
} from "../../../application/queries/index.js";
import { NotificationService } from "../../../application/services/index.js";

interface ScheduleNotificationRequest {
  type: string;
  channel?: string;
  templateId?: string;
  payload?: Record<string, any>;
  scheduledAt: Date;
}

export class NotificationController {
  private scheduleNotificationHandler: ScheduleNotificationHandler;
  private sendNotificationHandler: SendNotificationHandler;
  private getNotificationHandler: GetNotificationHandler;
  private getUserNotificationsHandler: GetUserNotificationsHandler;

  constructor(private readonly notificationService: NotificationService) {
    this.scheduleNotificationHandler = new ScheduleNotificationHandler(
      notificationService
    );
    this.sendNotificationHandler = new SendNotificationHandler(
      notificationService
    );
    this.getNotificationHandler = new GetNotificationHandler(
      notificationService
    );
    this.getUserNotificationsHandler = new GetUserNotificationsHandler(
      notificationService
    );
  }

  async scheduleNotification(
    request: FastifyRequest<{ Body: ScheduleNotificationRequest }>,
    reply: FastifyReply
  ) {
    try {
      const { type, channel, templateId, payload, scheduledAt } = request.body;

      const command: ScheduleNotificationCommand = {
        type,
        channel,
        templateId,
        payload,
        scheduledAt,
      };

      const result = await this.scheduleNotificationHandler.handle(command);

      if (result.success && result.data) {
        return reply.code(201).send({
          success: true,
          data: result.data,
          message: "Notification scheduled successfully",
        });
      } else {
        return reply.code(400).send({
          success: false,
          error: result.error || "Failed to schedule notification",
          errors: result.errors,
        });
      }
    } catch (error) {
      request.log.error(error, "Failed to schedule notification");
      return reply.code(500).send({
        success: false,
        error: "Internal server error",
        message: "Failed to schedule notification",
      });
    }
  }

  async sendNotification(
    request: FastifyRequest<{ Params: { notificationId: string } }>,
    reply: FastifyReply
  ) {
    try {
      const { notificationId } = request.params;

      const command: SendNotificationCommand = {
        notificationId,
      };

      const result = await this.sendNotificationHandler.handle(command);

      if (result.success) {
        return reply.code(200).send({
          success: true,
          message: "Notification sent successfully",
        });
      } else {
        return reply.code(400).send({
          success: false,
          error: result.error || "Failed to send notification",
          errors: result.errors,
        });
      }
    } catch (error) {
      request.log.error(error, "Failed to send notification");
      return reply.code(500).send({
        success: false,
        error: "Internal server error",
        message: "Failed to send notification",
      });
    }
  }

  async getNotification(
    request: FastifyRequest<{ Params: { notificationId: string } }>,
    reply: FastifyReply
  ) {
    try {
      const { notificationId } = request.params;

      if (!notificationId || typeof notificationId !== "string") {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: "Notification ID is required and must be a valid string",
        });
      }

      const query: GetNotificationQuery = { notificationId };
      const result = await this.getNotificationHandler.handle(query);

      if (result.success && result.data) {
        return reply.code(200).send({
          success: true,
          data: result.data,
        });
      } else if (result.success && result.data === null) {
        return reply.code(404).send({
          success: false,
          error: "Notification not found",
        });
      } else {
        return reply.code(400).send({
          success: false,
          error: result.error || "Failed to retrieve notification",
          errors: result.errors,
        });
      }
    } catch (error) {
      request.log.error(error, "Failed to get notification");
      return reply.code(500).send({
        success: false,
        error: "Internal server error",
        message: "Failed to retrieve notification",
      });
    }
  }

  async getUserNotifications(
    request: FastifyRequest<{
      Params: { type: string };
      Querystring: { limit?: string; offset?: string };
    }>,
    reply: FastifyReply
  ) {
    try {
      const { type } = request.params;
      const { limit, offset } = request.query;

      if (!type || typeof type !== "string") {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: "Notification type is required and must be a valid string",
        });
      }

      const query: GetUserNotificationsQuery = {
        type,
        limit: limit ? parseInt(limit, 10) : undefined,
        offset: offset ? parseInt(offset, 10) : undefined,
      };

      const result = await this.getUserNotificationsHandler.handle(query);

      if (result.success && result.data) {
        return reply.code(200).send({
          success: true,
          data: result.data,
          total: result.data.length,
        });
      } else {
        return reply.code(400).send({
          success: false,
          error: result.error || "Failed to retrieve user notifications",
          errors: result.errors,
        });
      }
    } catch (error) {
      request.log.error(error, "Failed to get user notifications");
      return reply.code(500).send({
        success: false,
        error: "Internal server error",
        message: "Failed to retrieve user notifications",
      });
    }
  }
}
