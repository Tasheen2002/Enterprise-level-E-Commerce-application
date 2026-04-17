import { FastifyReply } from "fastify";
import { AuthenticatedRequest } from "@/api/src/shared/interfaces/authenticated-request.interface";
import { ResponseHelper } from "@/api/src/shared/response.helper";
import {
  CreateAppointmentHandler,
  UpdateAppointmentHandler,
  CancelAppointmentHandler,
  GetAppointmentHandler,
  GetUserAppointmentsHandler,
  GetLocationAppointmentsHandler,
} from "../../../application";

export class AppointmentController {
  constructor(
    private readonly createAppointmentHandler: CreateAppointmentHandler,
    private readonly updateAppointmentHandler: UpdateAppointmentHandler,
    private readonly cancelAppointmentHandler: CancelAppointmentHandler,
    private readonly getAppointmentHandler: GetAppointmentHandler,
    private readonly getUserAppointmentsHandler: GetUserAppointmentsHandler,
    private readonly getLocationAppointmentsHandler: GetLocationAppointmentsHandler,
  ) {}

  async createAppointment(
    request: AuthenticatedRequest<{
      Body: {
        userId: string;
        type: string;
        locationId?: string;
        startAt: Date;
        endAt: Date;
        notes?: string;
      };
    }>,
    reply: FastifyReply,
  ) {
    try {
      const { userId, type, locationId, startAt, endAt, notes } = request.body;
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

  async getAppointment(
    request: AuthenticatedRequest<{ Params: { appointmentId: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const dto = await this.getAppointmentHandler.handle({
        appointmentId: request.params.appointmentId,
      });
      return ResponseHelper.ok(reply, "Appointment retrieved successfully", dto);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async getUserAppointments(
    request: AuthenticatedRequest<{
      Params: { userId: string };
      Querystring: { limit?: number; offset?: number };
    }>,
    reply: FastifyReply,
  ) {
    try {
      const { userId } = request.params;
      const { limit, offset } = request.query;
      const result = await this.getUserAppointmentsHandler.handle({ userId, limit, offset });
      return ResponseHelper.ok(reply, "User appointments retrieved successfully", result);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async getLocationAppointments(
    request: AuthenticatedRequest<{
      Params: { locationId: string };
      Querystring: { limit?: number; offset?: number };
    }>,
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

  async updateAppointment(
    request: AuthenticatedRequest<{
      Params: { appointmentId: string };
      Body: {
        startAt?: Date;
        endAt?: Date;
        notes?: string;
        locationId?: string;
      };
    }>,
    reply: FastifyReply,
  ) {
    try {
      const { appointmentId } = request.params;
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
    request: AuthenticatedRequest<{ Params: { appointmentId: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const result = await this.cancelAppointmentHandler.handle({
        appointmentId: request.params.appointmentId,
      });
      return ResponseHelper.fromCommand(reply, result, "Appointment cancelled successfully");
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }
}
