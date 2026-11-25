import { FastifyReply } from "fastify";
import { AuthenticatedRequest } from "@/api/src/shared/interfaces/authenticated-request.interface";
import { ResponseHelper } from "@/api/src/shared/response.helper";
import {
  hasRole,
  CUSTOMER_CARE_ROLES,
  STAFF_ROLES,
} from "@/api/src/shared/middleware/role-authorization.middleware";
import { ReminderNotFoundError } from "../../../domain/errors/engagement.errors";

// Reminders hold a customer's contact preferences: customers see and change
// only their own; staff may read any and customer care may change any.
const isStaff = (request: AuthenticatedRequest) => hasRole(request, [...STAFF_ROLES]);
const isCustomerCare = (request: AuthenticatedRequest) => hasRole(request, [...CUSTOMER_CARE_ROLES]);
import {
  CreateReminderHandler,
  MarkReminderAsSentHandler,
  UnsubscribeReminderHandler,
  DeleteReminderHandler,
  GetReminderHandler,
  GetUserRemindersHandler,
  GetVariantRemindersHandler,
} from "../../../application";
import {
  CreateReminderBody,
  ReminderIdParams,
  UserIdParams,
  VariantIdParams,
  PaginationQuery,
} from "../validation/reminder.schema";

export class ReminderController {
  constructor(
    private readonly createReminderHandler: CreateReminderHandler,
    private readonly markReminderAsSentHandler: MarkReminderAsSentHandler,
    private readonly unsubscribeReminderHandler: UnsubscribeReminderHandler,
    private readonly deleteReminderHandler: DeleteReminderHandler,
    private readonly getReminderHandler: GetReminderHandler,
    private readonly getUserRemindersHandler: GetUserRemindersHandler,
    private readonly getVariantRemindersHandler: GetVariantRemindersHandler,
  ) {}

  private async loadReminder(
    request: AuthenticatedRequest,
    reminderId: string,
    access: "read" | "write",
  ) {
    const dto = await this.getReminderHandler.handle({ reminderId });
    const staffAllowed = access === "read" ? isStaff(request) : isCustomerCare(request);
    if (!staffAllowed && dto.userId !== request.user.userId) {
      throw new ReminderNotFoundError(reminderId);
    }
    return dto;
  }

  // ── Reads (queries) ────────────────────────────────────────────────

  async getUserReminders(
    request: AuthenticatedRequest<{ Params: UserIdParams; Querystring: PaginationQuery }>,
    reply: FastifyReply,
  ) {
    try {
      const { userId } = request.params;
      if (request.user.userId !== userId && !isStaff(request)) {
        return ResponseHelper.forbidden(reply, "You can only view your own reminders");
      }
      const { limit, offset } = request.query;
      const result = await this.getUserRemindersHandler.handle({ userId, limit, offset });
      return ResponseHelper.ok(reply, "User reminders retrieved successfully", result);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async getVariantReminders(
    request: AuthenticatedRequest<{ Params: VariantIdParams; Querystring: PaginationQuery }>,
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

  async getReminder(
    request: AuthenticatedRequest<{ Params: ReminderIdParams }>,
    reply: FastifyReply,
  ) {
    try {
      const dto = await this.loadReminder(request, request.params.reminderId, "read");
      return ResponseHelper.ok(reply, "Reminder retrieved successfully", dto);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  // ── Writes (commands) ──────────────────────────────────────────────

  async createReminder(
    request: AuthenticatedRequest<{ Body: CreateReminderBody }>,
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

  async markReminderAsSent(
    request: AuthenticatedRequest<{ Params: ReminderIdParams }>,
    reply: FastifyReply,
  ) {
    try {
      const result = await this.markReminderAsSentHandler.handle({ reminderId: request.params.reminderId });
      return ResponseHelper.fromCommand(reply, result, "Reminder marked as sent successfully");
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async unsubscribeReminder(
    request: AuthenticatedRequest<{ Params: ReminderIdParams }>,
    reply: FastifyReply,
  ) {
    try {
      await this.loadReminder(request, request.params.reminderId, "write");
      const result = await this.unsubscribeReminderHandler.handle({ reminderId: request.params.reminderId });
      return ResponseHelper.fromCommand(reply, result, "Reminder unsubscribed successfully");
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async deleteReminder(
    request: AuthenticatedRequest<{ Params: ReminderIdParams }>,
    reply: FastifyReply,
  ) {
    try {
      await this.loadReminder(request, request.params.reminderId, "write");
      const result = await this.deleteReminderHandler.handle({ reminderId: request.params.reminderId });
      return ResponseHelper.fromCommand(reply, result, "Reminder deleted successfully", undefined, 204);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }
}
