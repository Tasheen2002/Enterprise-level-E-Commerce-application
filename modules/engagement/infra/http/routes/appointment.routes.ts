import { FastifyInstance } from "fastify";
import { AuthenticatedRequest } from "@/api/src/shared/interfaces/authenticated-request.interface";
import { RolePermissions } from "@/api/src/shared/middleware/role-authorization.middleware";
import { authenticate } from "@/api/src/shared/middleware/authenticate.middleware";
import {
  createRateLimiter,
  RateLimitPresets,
  userOrIpKeyGenerator,
} from "@/api/src/shared/middleware/rate-limiter.middleware";
import {
  successResponse,
  actionSuccessResponse,
  paginatedResponse,
} from "@/api/src/shared/http/response-schemas";
import { AppointmentController } from "../controllers/appointment.controller";
import {
  validateBody,
  validateParams,
  validateQuery,
  toJsonSchema,
} from "../validation/validator";
import {
  appointmentIdParamsSchema,
  userIdParamsSchema,
  locationIdParamsSchema,
  paginationQuerySchema,
  createAppointmentSchema,
  updateAppointmentSchema,
  appointmentResponseSchema,
} from "../validation/appointment.schema";

// Pre-compute JSON Schemas from Zod (single source of truth — no drift).
const appointmentIdParamsJson = toJsonSchema(appointmentIdParamsSchema);
const userIdParamsJson = toJsonSchema(userIdParamsSchema);
const locationIdParamsJson = toJsonSchema(locationIdParamsSchema);
const paginationQueryJson = toJsonSchema(paginationQuerySchema);
const createAppointmentBodyJson = toJsonSchema(createAppointmentSchema);
const updateAppointmentBodyJson = toJsonSchema(updateAppointmentSchema);

const writeRateLimiter = createRateLimiter({
  ...RateLimitPresets.writeOperations,
  keyGenerator: userOrIpKeyGenerator,
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
      preHandler: [authenticate, RolePermissions.AUTHENTICATED],
      schema: {
        description: "Get a specific appointment by ID",
        summary: "Get Appointment",
        tags: ["Engagement - Appointments"],
        security: [{ bearerAuth: [] }],
        params: appointmentIdParamsJson,
        response: {
          200: successResponse(appointmentResponseSchema),
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
      preHandler: [authenticate, RolePermissions.AUTHENTICATED],
      schema: {
        description: "Get all appointments for a specific user",
        summary: "Get User Appointments",
        tags: ["Engagement - Appointments"],
        security: [{ bearerAuth: [] }],
        params: userIdParamsJson,
        querystring: paginationQueryJson,
        response: {
          200: successResponse(paginatedResponse(appointmentResponseSchema)),
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
      preHandler: [authenticate, RolePermissions.ADMIN_ONLY],
      schema: {
        description: "Get all appointments for a specific location",
        summary: "Get Location Appointments",
        tags: ["Engagement - Appointments"],
        security: [{ bearerAuth: [] }],
        params: locationIdParamsJson,
        querystring: paginationQueryJson,
        response: {
          200: successResponse(paginatedResponse(appointmentResponseSchema)),
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
      preHandler: [authenticate, RolePermissions.AUTHENTICATED],
      schema: {
        description: "Create a new appointment",
        summary: "Create Appointment",
        tags: ["Engagement - Appointments"],
        security: [{ bearerAuth: [] }],
        body: createAppointmentBodyJson,
        response: {
          201: successResponse(appointmentResponseSchema, 201),
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
      preHandler: [authenticate, RolePermissions.AUTHENTICATED],
      schema: {
        description: "Cancel an appointment",
        summary: "Cancel Appointment",
        tags: ["Engagement - Appointments"],
        security: [{ bearerAuth: [] }],
        params: appointmentIdParamsJson,
        response: {
          200: actionSuccessResponse(),
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
      preHandler: [authenticate, RolePermissions.AUTHENTICATED],
      schema: {
        description: "Update appointment details",
        summary: "Update Appointment",
        tags: ["Engagement - Appointments"],
        security: [{ bearerAuth: [] }],
        params: appointmentIdParamsJson,
        body: updateAppointmentBodyJson,
        response: {
          200: actionSuccessResponse(),
        },
      },
    },
    (request, reply) => controller.updateAppointment(request as AuthenticatedRequest, reply),
  );
}
