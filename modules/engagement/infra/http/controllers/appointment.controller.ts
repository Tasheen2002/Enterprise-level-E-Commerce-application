import { FastifyRequest, FastifyReply } from "fastify";
import {
  CreateAppointmentCommand,
  CreateAppointmentHandler,
  UpdateAppointmentCommand,
  UpdateAppointmentHandler,
  CancelAppointmentCommand,
  CancelAppointmentHandler,
} from "../../../application/commands/index.js";
import {
  GetAppointmentQuery,
  GetAppointmentHandler,
  GetUserAppointmentsQuery,
  GetUserAppointmentsHandler,
  GetLocationAppointmentsQuery,
  GetLocationAppointmentsHandler,
} from "../../../application/queries/index.js";
import { AppointmentService } from "../../../application/services/index.js";

interface CreateAppointmentRequest {
  userId: string;
  type: string;
  locationId?: string;
  startAt: Date;
  endAt: Date;
  notes?: string;
}

interface UpdateAppointmentRequest {
  startAt?: Date;
  endAt?: Date;
  notes?: string;
  locationId?: string;
}

export class AppointmentController {
  private createAppointmentHandler: CreateAppointmentHandler;
  private updateAppointmentHandler: UpdateAppointmentHandler;
  private cancelAppointmentHandler: CancelAppointmentHandler;
  private getAppointmentHandler: GetAppointmentHandler;
  private getUserAppointmentsHandler: GetUserAppointmentsHandler;
  private getLocationAppointmentsHandler: GetLocationAppointmentsHandler;

  constructor(private readonly appointmentService: AppointmentService) {
    this.createAppointmentHandler = new CreateAppointmentHandler(
      appointmentService
    );
    this.updateAppointmentHandler = new UpdateAppointmentHandler(
      appointmentService
    );
    this.cancelAppointmentHandler = new CancelAppointmentHandler(
      appointmentService
    );
    this.getAppointmentHandler = new GetAppointmentHandler(appointmentService);
    this.getUserAppointmentsHandler = new GetUserAppointmentsHandler(
      appointmentService
    );
    this.getLocationAppointmentsHandler = new GetLocationAppointmentsHandler(
      appointmentService
    );
  }

  async createAppointment(
    request: FastifyRequest<{ Body: CreateAppointmentRequest }>,
    reply: FastifyReply
  ) {
    try {
      const { userId, type, locationId, startAt, endAt, notes } = request.body;

      const command: CreateAppointmentCommand = {
        userId,
        type,
        locationId,
        startAt,
        endAt,
        notes,
      };

      const result = await this.createAppointmentHandler.handle(command);

      if (result.success && result.data) {
        return reply.code(201).send({
          success: true,
          data: result.data,
          message: "Appointment created successfully",
        });
      } else {
        return reply.code(400).send({
          success: false,
          error: result.error || "Failed to create appointment",
          errors: result.errors,
        });
      }
    } catch (error) {
      request.log.error(error, "Failed to create appointment");
      return reply.code(500).send({
        success: false,
        error: "Internal server error",
        message: "Failed to create appointment",
      });
    }
  }

  async getAppointment(
    request: FastifyRequest<{ Params: { appointmentId: string } }>,
    reply: FastifyReply
  ) {
    try {
      const { appointmentId } = request.params;

      if (!appointmentId || typeof appointmentId !== "string") {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: "Appointment ID is required and must be a valid string",
        });
      }

      const query: GetAppointmentQuery = { appointmentId };
      const result = await this.getAppointmentHandler.handle(query);

      if (result.success && result.data) {
        return reply.code(200).send({
          success: true,
          data: result.data,
        });
      } else if (result.success && result.data === null) {
        return reply.code(404).send({
          success: false,
          error: "Appointment not found",
        });
      } else {
        return reply.code(400).send({
          success: false,
          error: result.error || "Failed to retrieve appointment",
          errors: result.errors,
        });
      }
    } catch (error) {
      request.log.error(error, "Failed to get appointment");
      return reply.code(500).send({
        success: false,
        error: "Internal server error",
        message: "Failed to retrieve appointment",
      });
    }
  }

  async getUserAppointments(
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

      const query: GetUserAppointmentsQuery = {
        userId,
        limit: limit ? parseInt(limit, 10) : undefined,
        offset: offset ? parseInt(offset, 10) : undefined,
      };

      const result = await this.getUserAppointmentsHandler.handle(query);

      if (result.success && result.data) {
        return reply.code(200).send({
          success: true,
          data: result.data,
          total: result.data.length,
        });
      } else {
        return reply.code(400).send({
          success: false,
          error: result.error || "Failed to retrieve user appointments",
          errors: result.errors,
        });
      }
    } catch (error) {
      request.log.error(error, "Failed to get user appointments");
      return reply.code(500).send({
        success: false,
        error: "Internal server error",
        message: "Failed to retrieve user appointments",
      });
    }
  }

  async getLocationAppointments(
    request: FastifyRequest<{
      Params: { locationId: string };
      Querystring: { limit?: string; offset?: string };
    }>,
    reply: FastifyReply
  ) {
    try {
      const { locationId } = request.params;
      const { limit, offset } = request.query;

      if (!locationId || typeof locationId !== "string") {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: "Location ID is required and must be a valid string",
        });
      }

      const query: GetLocationAppointmentsQuery = {
        locationId,
        limit: limit ? parseInt(limit, 10) : undefined,
        offset: offset ? parseInt(offset, 10) : undefined,
      };

      const result = await this.getLocationAppointmentsHandler.handle(query);

      if (result.success && result.data) {
        return reply.code(200).send({
          success: true,
          data: result.data,
          total: result.data.length,
        });
      } else {
        return reply.code(400).send({
          success: false,
          error: result.error || "Failed to retrieve location appointments",
          errors: result.errors,
        });
      }
    } catch (error) {
      request.log.error(error, "Failed to get location appointments");
      return reply.code(500).send({
        success: false,
        error: "Internal server error",
        message: "Failed to retrieve location appointments",
      });
    }
  }

  async updateAppointment(
    request: FastifyRequest<{
      Params: { appointmentId: string };
      Body: UpdateAppointmentRequest;
    }>,
    reply: FastifyReply
  ) {
    try {
      const { appointmentId } = request.params;
      const { startAt, endAt, notes, locationId } = request.body;

      const command: UpdateAppointmentCommand = {
        appointmentId,
        startAt,
        endAt,
        notes,
        locationId,
      };

      const result = await this.updateAppointmentHandler.handle(command);

      if (result.success) {
        return reply.code(200).send({
          success: true,
          message: "Appointment updated successfully",
        });
      } else {
        return reply.code(400).send({
          success: false,
          error: result.error || "Failed to update appointment",
          errors: result.errors,
        });
      }
    } catch (error) {
      request.log.error(error, "Failed to update appointment");
      return reply.code(500).send({
        success: false,
        error: "Internal server error",
        message: "Failed to update appointment",
      });
    }
  }

  async cancelAppointment(
    request: FastifyRequest<{ Params: { appointmentId: string } }>,
    reply: FastifyReply
  ) {
    try {
      const { appointmentId } = request.params;

      const command: CancelAppointmentCommand = {
        appointmentId,
      };

      const result = await this.cancelAppointmentHandler.handle(command);

      if (result.success) {
        return reply.code(200).send({
          success: true,
          message: "Appointment cancelled successfully",
        });
      } else {
        return reply.code(400).send({
          success: false,
          error: result.error || "Failed to cancel appointment",
          errors: result.errors,
        });
      }
    } catch (error) {
      request.log.error(error, "Failed to cancel appointment");
      return reply.code(500).send({
        success: false,
        error: "Internal server error",
        message: "Failed to cancel appointment",
      });
    }
  }
}
