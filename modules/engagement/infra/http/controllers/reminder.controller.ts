import { FastifyReply } from "fastify";
import { AuthenticatedRequest } from "@/api/src/shared/interfaces/authenticated-request.interface";
import { ResponseHelper } from "@/api/src/shared/response.helper";
import {
  CreateReminderHandler,
  UpdateReminderStatusHandler,
  UnsubscribeReminderHandler,
  DeleteReminderHandler,
  GetReminderHandler,
  GetUserRemindersHandler,
  GetVariantRemindersHandler,
} from "../../../application";

export class ReminderController {
  constructor(
    private readonly createReminderHandler: CreateReminderHandler,
    private readonly updateReminderStatusHandler: UpdateReminderStatusHandler,
    private readonly unsubscribeReminderHandler: UnsubscribeReminderHandler,
    private readonly deleteReminderHandler: DeleteReminderHandler,
    private readonly getReminderHandler: GetReminderHandler,
    private readonly getUserRemindersHandler: GetUserRemindersHandler,
    private readonly getVariantRemindersHandler: GetVariantRemindersHandler,
  ) {}

  async createReminder(
    request: AuthenticatedRequest<{
      Body: {
        type: string;
        variantId: string;
        userId?: string;
        contact: string;
        channel: string;
        optInAt?: Date;
      };
    }>,
    reply: FastifyReply,
  ) {
    try {
      const { type, variantId, contact, channel, optInAt } = request.body;
      const result = await this.createReminderHandler.handle({
        type,
        variantId,
        userId: request.user?.userId,
        contact,
        channel,
        optInAt,
      });
      return ResponseHelper.fromCommand(reply, result, "Reminder created successfully", 201);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async getReminder(
    request: AuthenticatedRequest<{ Params: { reminderId: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const dto = await this.getReminderHandler.handle({ reminderId: request.params.reminderId });
      return ResponseHelper.ok(reply, "Reminder retrieved successfully", dto);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async getUserReminders(
    request: AuthenticatedRequest<{
      Params: { userId: string };
      Querystring: { limit?: number; offset?: number };
    }>,
    reply: FastifyReply,
  ) {
    try {
      const { userId } = request.params;
      const { limit, offset } = request.query;
      const result = await this.getUserRemindersHandler.handle({ userId, limit, offset });
      return ResponseHelper.ok(reply, "User reminders retrieved successfully", result);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async getVariantReminders(
    request: AuthenticatedRequest<{
      Params: { variantId: string };
      Querystring: { limit?: number; offset?: number };
    }>,
    reply: FastifyReply,
  ) {
    try {
      const { variantId } = request.params;
      const { limit, offset } = request.query;
      const result = await this.getVariantRemindersHandler.handle({ variantId, limit, offset });
      return ResponseHelper.ok(reply, "Variant reminders retrieved successfully", result);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async updateReminderStatus(
    request: AuthenticatedRequest<{
      Params: { reminderId: string };
      Body: { status: "sent" };
    }>,
    reply: FastifyReply,
  ) {
    try {
      const { reminderId } = request.params;
      const { status } = request.body;
      const result = await this.updateReminderStatusHandler.handle({ reminderId, status });
      return ResponseHelper.fromCommand(reply, result, "Reminder status updated successfully");
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async unsubscribeReminder(
    request: AuthenticatedRequest<{ Params: { reminderId: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const result = await this.unsubscribeReminderHandler.handle({ reminderId: request.params.reminderId });
      return ResponseHelper.fromCommand(reply, result, "Reminder unsubscribed successfully");
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async deleteReminder(
    request: AuthenticatedRequest<{ Params: { reminderId: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const result = await this.deleteReminderHandler.handle({ reminderId: request.params.reminderId });
      return ResponseHelper.fromCommand(reply, result, "Reminder deleted successfully");
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }
}
