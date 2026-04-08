import { FastifyRequest, FastifyReply } from "fastify";
import {
  CreateReminderCommand,
  CreateReminderHandler,
  UpdateReminderStatusCommand,
  UpdateReminderStatusHandler,
  UnsubscribeReminderCommand,
  UnsubscribeReminderHandler,
  DeleteReminderCommand,
  DeleteReminderHandler,
} from "../../../application/commands/index.js";
import {
  GetReminderQuery,
  GetReminderHandler,
  GetUserRemindersQuery,
  GetUserRemindersHandler,
  GetVariantRemindersQuery,
  GetVariantRemindersHandler,
} from "../../../application/queries/index.js";
import { ReminderManagementService } from "../../../application/services/index.js";

interface CreateReminderRequest {
  type: string;
  variantId: string;
  userId?: string;
  contact: string;
  channel: string;
  optInAt?: Date;
}

interface UpdateReminderStatusRequest {
  status: "sent";
}

export class ReminderController {
  private createReminderHandler: CreateReminderHandler;
  private updateReminderStatusHandler: UpdateReminderStatusHandler;
  private unsubscribeReminderHandler: UnsubscribeReminderHandler;
  private deleteReminderHandler: DeleteReminderHandler;
  private getReminderHandler: GetReminderHandler;
  private getUserRemindersHandler: GetUserRemindersHandler;
  private getVariantRemindersHandler: GetVariantRemindersHandler;

  constructor(private readonly reminderService: ReminderManagementService) {
    this.createReminderHandler = new CreateReminderHandler(reminderService);
    this.updateReminderStatusHandler = new UpdateReminderStatusHandler(
      reminderService
    );
    this.unsubscribeReminderHandler = new UnsubscribeReminderHandler(
      reminderService
    );
    this.deleteReminderHandler = new DeleteReminderHandler(reminderService);
    this.getReminderHandler = new GetReminderHandler(reminderService);
    this.getUserRemindersHandler = new GetUserRemindersHandler(
      reminderService
    );
    this.getVariantRemindersHandler = new GetVariantRemindersHandler(
      reminderService
    );
  }

  async createReminder(
    request: FastifyRequest<{ Body: CreateReminderRequest }>,
    reply: FastifyReply
  ) {
    try {
      const { type, variantId, contact, channel, optInAt } =
        request.body;

      // Extract userId from authenticated user (set by auth middleware)
      const userId = request.user?.userId;

      const command: CreateReminderCommand = {
        type,
        variantId,
        userId,
        contact,
        channel,
        optInAt,
      };

      const result = await this.createReminderHandler.handle(command);

      if (result.success && result.data) {
        return reply.code(201).send({
          success: true,
          data: result.data,
          message: "Reminder created successfully",
        });
      } else {
        return reply.code(400).send({
          success: false,
          error: result.error || "Failed to create reminder",
          errors: result.errors,
        });
      }
    } catch (error) {
      request.log.error(error, "Failed to create reminder");
      return reply.code(500).send({
        success: false,
        error: "Internal server error",
        message: "Failed to create reminder",
      });
    }
  }

  async getReminder(
    request: FastifyRequest<{ Params: { reminderId: string } }>,
    reply: FastifyReply
  ) {
    try {
      const { reminderId } = request.params;

      if (!reminderId || typeof reminderId !== "string") {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: "Reminder ID is required and must be a valid string",
        });
      }

      const query: GetReminderQuery = { reminderId };
      const result = await this.getReminderHandler.handle(query);

      if (result.success && result.data) {
        return reply.code(200).send({
          success: true,
          data: result.data,
        });
      } else if (result.success && result.data === null) {
        return reply.code(404).send({
          success: false,
          error: "Reminder not found",
        });
      } else {
        return reply.code(400).send({
          success: false,
          error: result.error || "Failed to retrieve reminder",
          errors: result.errors,
        });
      }
    } catch (error) {
      request.log.error(error, "Failed to get reminder");
      return reply.code(500).send({
        success: false,
        error: "Internal server error",
        message: "Failed to retrieve reminder",
      });
    }
  }

  async getUserReminders(
    request: FastifyRequest<{
      Params: { userId: string };
      Querystring: { limit?: string; offset?: string };
    }>,
    reply: FastifyReply
  ) {
    try {
      const { userId } = request.params;
      const { limit, offset } = request.query;

      if (!userId || typeof userId !== "string") {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: "User ID is required and must be a valid string",
        });
      }

      const query: GetUserRemindersQuery = {
        userId,
        limit: limit ? parseInt(limit, 10) : undefined,
        offset: offset ? parseInt(offset, 10) : undefined,
      };

      const result = await this.getUserRemindersHandler.handle(query);

      if (result.success && result.data) {
        return reply.code(200).send({
          success: true,
          data: result.data,
          total: result.data.length,
        });
      } else {
        return reply.code(400).send({
          success: false,
          error: result.error || "Failed to retrieve user reminders",
          errors: result.errors,
        });
      }
    } catch (error) {
      request.log.error(error, "Failed to get user reminders");
      return reply.code(500).send({
        success: false,
        error: "Internal server error",
        message: "Failed to retrieve user reminders",
      });
    }
  }

  async getVariantReminders(
    request: FastifyRequest<{
      Params: { variantId: string };
      Querystring: { limit?: string; offset?: string };
    }>,
    reply: FastifyReply
  ) {
    try {
      const { variantId } = request.params;
      const { limit, offset } = request.query;

      if (!variantId || typeof variantId !== "string") {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: "Variant ID is required and must be a valid string",
        });
      }

      const query: GetVariantRemindersQuery = {
        variantId,
        limit: limit ? parseInt(limit, 10) : undefined,
        offset: offset ? parseInt(offset, 10) : undefined,
      };

      const result = await this.getVariantRemindersHandler.handle(query);

      if (result.success && result.data) {
        return reply.code(200).send({
          success: true,
          data: result.data,
          total: result.data.length,
        });
      } else {
        return reply.code(400).send({
          success: false,
          error: result.error || "Failed to retrieve variant reminders",
          errors: result.errors,
        });
      }
    } catch (error) {
      request.log.error(error, "Failed to get variant reminders");
      return reply.code(500).send({
        success: false,
        error: "Internal server error",
        message: "Failed to retrieve variant reminders",
      });
    }
  }

  async updateReminderStatus(
    request: FastifyRequest<{
      Params: { reminderId: string };
      Body: UpdateReminderStatusRequest;
    }>,
    reply: FastifyReply
  ) {
    try {
      const { reminderId } = request.params;
      const { status } = request.body;

      const command: UpdateReminderStatusCommand = {
        reminderId,
        status,
      };

      const result = await this.updateReminderStatusHandler.handle(command);

      if (result.success) {
        return reply.code(200).send({
          success: true,
          message: "Reminder status updated successfully",
        });
      } else {
        return reply.code(400).send({
          success: false,
          error: result.error || "Failed to update reminder status",
          errors: result.errors,
        });
      }
    } catch (error) {
      request.log.error(error, "Failed to update reminder status");
      return reply.code(500).send({
        success: false,
        error: "Internal server error",
        message: "Failed to update reminder status",
      });
    }
  }

  async unsubscribeReminder(
    request: FastifyRequest<{ Params: { reminderId: string } }>,
    reply: FastifyReply
  ) {
    try {
      const { reminderId } = request.params;

      const command: UnsubscribeReminderCommand = {
        reminderId,
      };

      const result = await this.unsubscribeReminderHandler.handle(command);

      if (result.success) {
        return reply.code(200).send({
          success: true,
          message: "Reminder unsubscribed successfully",
        });
      } else {
        return reply.code(400).send({
          success: false,
          error: result.error || "Failed to unsubscribe reminder",
          errors: result.errors,
        });
      }
    } catch (error) {
      request.log.error(error, "Failed to unsubscribe reminder");
      return reply.code(500).send({
        success: false,
        error: "Internal server error",
        message: "Failed to unsubscribe reminder",
      });
    }
  }

  async deleteReminder(
    request: FastifyRequest<{ Params: { reminderId: string } }>,
    reply: FastifyReply
  ) {
    try {
      const { reminderId } = request.params;

      const command: DeleteReminderCommand = {
        reminderId,
      };

      const result = await this.deleteReminderHandler.handle(command);

      if (result.success) {
        return reply.code(200).send({
          success: true,
          message: "Reminder deleted successfully",
        });
      } else {
        return reply.code(400).send({
          success: false,
          error: result.error || "Failed to delete reminder",
          errors: result.errors,
        });
      }
    } catch (error) {
      request.log.error(error, "Failed to delete reminder");
      return reply.code(500).send({
        success: false,
        error: "Internal server error",
        message: "Failed to delete reminder",
      });
    }
  }
}
