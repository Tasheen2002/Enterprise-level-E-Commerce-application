import { FastifyReply } from "fastify";
import { AuthenticatedRequest } from "@/api/src/shared/interfaces/authenticated-request.interface";
import { ResponseHelper } from "@/api/src/shared/response.helper";
import {
  hasRole,
  STAFF_ROLES,
  STORE_OPERATIONS_ROLES,
} from "@/api/src/shared/middleware/role-authorization.middleware";
import { AppointmentNotFoundError } from "../../../domain/errors/engagement.errors";

// Customers book, see and change only their own appointments; staff may read
// any, and store staff may book for a customer and change any appointment.
const isStaff = (request: AuthenticatedRequest) => hasRole(request, [...STAFF_ROLES]);
const isStoreStaff = (request: AuthenticatedRequest) =>
  hasRole(request, [...STORE_OPERATIONS_ROLES]);
import {
  CreateAppointmentHandler,
  UpdateAppointmentHandler,
  CancelAppointmentHandler,
  GetAppointmentHandler,
  GetUserAppointmentsHandler,
  GetLocationAppointmentsHandler,
} from "../../../application";
import {
  CreateAppointmentBody,
  UpdateAppointmentBody,
  AppointmentIdParams,
  UserIdParams,
  LocationIdParams,
  PaginationQuery,
} from "../validation/appointment.schema";

export class AppointmentController {
  constructor(
    private readonly createAppointmentHandler: CreateAppointmentHandler,
    private readonly updateAppointmentHandler: UpdateAppointmentHandler,
    private readonly cancelAppointmentHandler: CancelAppointmentHandler,
    private readonly getAppointmentHandler: GetAppointmentHandler,
    private readonly getUserAppointmentsHandler: GetUserAppointmentsHandler,
    private readonly getLocationAppointmentsHandler: GetLocationAppointmentsHandler,
  ) {}

  private async loadAppointment(
    request: AuthenticatedRequest,
    appointmentId: string,
    access: "read" | "write",
  ) {
    const dto = await this.getAppointmentHandler.handle({ appointmentId });
    const staffAllowed = access === "read" ? isStaff(request) : isStoreStaff(request);
    if (!staffAllowed && dto.userId !== request.user.userId) {
      throw new AppointmentNotFoundError(appointmentId);
    }
    return dto;
  }

  // ── Reads (queries) ────────────────────────────────────────────────

  async getUserAppointments(
    request: AuthenticatedRequest<{ Params: UserIdParams; Querystring: PaginationQuery }>,
    reply: FastifyReply,
  ) {
    try {
      const { userId } = request.params;
      if (request.user.userId !== userId && !isStaff(request)) {
        return ResponseHelper.forbidden(reply, "You can only view your own appointments");
      }
      const { limit, offset } = request.query;
      const result = await this.getUserAppointmentsHandler.handle({ userId, limit, offset });
      return ResponseHelper.ok(reply, "User appointments retrieved successfully", result);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async getLocationAppointments(
    request: AuthenticatedRequest<{ Params: LocationIdParams; Querystring: PaginationQuery }>,
    reply: FastifyReply,
  ) {
    try {
      const { locationId } = request.params;
      const { limit, offset } = request.query;
      const result = await this.getLocationAppointmentsHandler.handle({ locationId, limit, offset });
      return ResponseHelper.ok(reply, "Location appointments retrieved successfully", result);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async getAppointment(
    request: AuthenticatedRequest<{ Params: AppointmentIdParams }>,
    reply: FastifyReply,
  ) {
    try {
      const dto = await this.loadAppointment(request, request.params.appointmentId, "read");
      return ResponseHelper.ok(reply, "Appointment retrieved successfully", dto);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  // ── Writes (commands) ──────────────────────────────────────────────

  async createAppointment(
    request: AuthenticatedRequest<{ Body: CreateAppointmentBody }>,
    reply: FastifyReply,
  ) {
    try {
      const { userId: requestedUserId, type, locationId, startAt, endAt, notes } = request.body;
      // Customers book for themselves; store staff may book for a named customer.
      const userId =
        isStoreStaff(request) && requestedUserId ? requestedUserId : request.user.userId;
      const result = await this.createAppointmentHandler.handle({
        userId,
        type,
        locationId,
        startAt,
        endAt,
        notes,
      });
      return ResponseHelper.fromCommand(reply, result, "Appointment created successfully", 201);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async updateAppointment(
    request: AuthenticatedRequest<{ Params: AppointmentIdParams; Body: UpdateAppointmentBody }>,
    reply: FastifyReply,
  ) {
    try {
      const { appointmentId } = request.params;
      await this.loadAppointment(request, appointmentId, "write");
      const { startAt, endAt, notes, locationId } = request.body;
      const result = await this.updateAppointmentHandler.handle({
        appointmentId,
        startAt,
        endAt,
        notes,
        locationId,
      });
      return ResponseHelper.fromCommand(reply, result, "Appointment updated successfully");
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async cancelAppointment(
    request: AuthenticatedRequest<{ Params: AppointmentIdParams }>,
    reply: FastifyReply,
  ) {
    try {
      await this.loadAppointment(request, request.params.appointmentId, "write");
      const result = await this.cancelAppointmentHandler.handle({
        appointmentId: request.params.appointmentId,
      });
      return ResponseHelper.fromCommand(reply, result, "Appointment cancelled successfully");
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }
}
