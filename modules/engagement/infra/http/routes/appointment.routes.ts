import { FastifyInstance } from "fastify";
import { AuthenticatedRequest } from "@/api/src/shared/interfaces/authenticated-request.interface";
import { RolePermissions } from "@/api/src/shared/middleware/role-authorization.middleware";
import {
  createRateLimiter,
  RateLimitPresets,
  userKeyGenerator,
} from "@/api/src/shared/middleware/rate-limiter.middleware";
import { AppointmentController } from "../controllers/appointment.controller";
import { validateBody, validateParams, validateQuery } from "../validation/validator";
import {
  appointmentIdParamsSchema,
  userIdParamsSchema,
  locationIdParamsSchema,
  paginationQuerySchema,
  createAppointmentSchema,
  updateAppointmentSchema,
  appointmentResponseSchema,
} from "../validation/appointment.schema";

const writeRateLimiter = createRateLimiter({
  ...RateLimitPresets.writeOperations,
  keyGenerator: userKeyGenerator,
});

export async function appointmentRoutes(
  fastify: FastifyInstance,
  controller: AppointmentController,
): Promise<void> {
  fastify.addHook("onRequest", async (request, reply) => {
    if (request.method !== "GET") {
      await writeRateLimiter(request, reply);
    }
  });

  // GET /engagement/appointments/:appointmentId — Get appointment
  fastify.get(
    "/engagement/appointments/:appointmentId",
    {
      preValidation: [validateParams(appointmentIdParamsSchema)],
      preHandler: [RolePermissions.AUTHENTICATED],
      schema: {
        description: "Get a specific appointment by ID",
        summary: "Get Appointment",
        tags: ["Engagement - Appointments"],
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["appointmentId"],
          properties: {
            appointmentId: { type: "string", format: "uuid" },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: appointmentResponseSchema,
            },
          },
        },
      },
    },
    (request, reply) => controller.getAppointment(request as AuthenticatedRequest, reply),
  );

  // GET /engagement/users/:userId/appointments — Get user appointments
  fastify.get(
    "/engagement/users/:userId/appointments",
    {
      preValidation: [validateParams(userIdParamsSchema), validateQuery(paginationQuerySchema)],
      preHandler: [RolePermissions.AUTHENTICATED],
      schema: {
        description: "Get all appointments for a specific user",
        summary: "Get User Appointments",
        tags: ["Engagement - Appointments"],
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["userId"],
          properties: {
            userId: { type: "string", format: "uuid" },
          },
        },
        querystring: {
          type: "object",
          properties: {
            limit: { type: "integer", minimum: 1 },
            offset: { type: "integer", minimum: 0 },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: { type: "array", items: appointmentResponseSchema },
              total: { type: "number" },
            },
          },
        },
      },
    },
    (request, reply) => controller.getUserAppointments(request as AuthenticatedRequest, reply),
  );

  // GET /engagement/locations/:locationId/appointments — Get location appointments (admin)
  fastify.get(
    "/engagement/locations/:locationId/appointments",
    {
      preValidation: [validateParams(locationIdParamsSchema), validateQuery(paginationQuerySchema)],
      preHandler: [RolePermissions.ADMIN_ONLY],
      schema: {
        description: "Get all appointments for a specific location",
        summary: "Get Location Appointments",
        tags: ["Engagement - Appointments"],
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["locationId"],
          properties: {
            locationId: { type: "string", format: "uuid" },
          },
        },
        querystring: {
          type: "object",
          properties: {
            limit: { type: "integer", minimum: 1 },
            offset: { type: "integer", minimum: 0 },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: { type: "array", items: appointmentResponseSchema },
              total: { type: "number" },
            },
          },
        },
      },
    },
    (request, reply) => controller.getLocationAppointments(request as AuthenticatedRequest, reply),
  );

  // POST /engagement/appointments — Create appointment
  fastify.post(
    "/engagement/appointments",
    {
      preValidation: [validateBody(createAppointmentSchema)],
      preHandler: [RolePermissions.AUTHENTICATED],
      schema: {
        description: "Create a new appointment",
        summary: "Create Appointment",
        tags: ["Engagement - Appointments"],
        security: [{ bearerAuth: [] }],
        body: {
          type: "object",
          required: ["userId", "type", "startAt", "endAt"],
          properties: {
            userId: { type: "string", format: "uuid" },
            type: {
              type: "string",
              enum: ["consultation", "fitting", "styling", "product_demo", "personal_shopping"],
            },
            locationId: { type: "string", format: "uuid" },
            startAt: { type: "string", format: "date-time" },
            endAt: { type: "string", format: "date-time" },
            notes: { type: "string", maxLength: 2000 },
          },
        },
        response: {
          201: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: appointmentResponseSchema,
              message: { type: "string" },
            },
          },
        },
      },
    },
    (request, reply) => controller.createAppointment(request as AuthenticatedRequest, reply),
  );

  // POST /engagement/appointments/:appointmentId/cancel — Cancel appointment
  fastify.post(
    "/engagement/appointments/:appointmentId/cancel",
    {
      preValidation: [validateParams(appointmentIdParamsSchema)],
      preHandler: [RolePermissions.AUTHENTICATED],
      schema: {
        description: "Cancel an appointment",
        summary: "Cancel Appointment",
        tags: ["Engagement - Appointments"],
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["appointmentId"],
          properties: {
            appointmentId: { type: "string", format: "uuid" },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              message: { type: "string" },
            },
          },
        },
      },
    },
    (request, reply) => controller.cancelAppointment(request as AuthenticatedRequest, reply),
  );

  // PATCH /engagement/appointments/:appointmentId — Update appointment
  fastify.patch(
    "/engagement/appointments/:appointmentId",
    {
      preValidation: [validateParams(appointmentIdParamsSchema), validateBody(updateAppointmentSchema)],
      preHandler: [RolePermissions.AUTHENTICATED],
      schema: {
        description: "Update appointment details",
        summary: "Update Appointment",
        tags: ["Engagement - Appointments"],
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["appointmentId"],
          properties: {
            appointmentId: { type: "string", format: "uuid" },
          },
        },
        body: {
          type: "object",
          properties: {
            startAt: { type: "string", format: "date-time" },
            endAt: { type: "string", format: "date-time" },
            notes: { type: "string", maxLength: 2000 },
            locationId: { type: "string", format: "uuid" },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              message: { type: "string" },
            },
          },
        },
      },
    },
    (request, reply) => controller.updateAppointment(request as AuthenticatedRequest, reply),
  );
}
