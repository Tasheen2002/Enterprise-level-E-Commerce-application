import { FastifyInstance } from "fastify";
import { AuthenticatedRequest } from "@/api/src/shared/interfaces/authenticated-request.interface";
import { authenticate } from "@/api/src/shared/middleware/authenticate.middleware";
import { RolePermissions } from "@/api/src/shared/middleware/role-authorization.middleware";
import {
  createRateLimiter,
  RateLimitPresets,
  userKeyGenerator,
} from "@/api/src/shared/middleware/rate-limiter.middleware";
import { LocationController } from "../controllers/location.controller";
import { validateBody, validateParams, validateQuery, toJsonSchema } from "../validation/validator";
import {
  successResponse,
  noContentResponse,
  paginatedResponse,
} from "@/api/src/shared/http/response-schemas";
import {
  locationParamsSchema,
  listLocationsSchema,
  createLocationSchema,
  updateLocationSchema,
  locationResponseSchema,
} from "../validation/location.schema";

// Pre-compute JSON Schemas from Zod (single source of truth — no drift).
const locationParamsJson = toJsonSchema(locationParamsSchema);
const listLocationsQueryJson = toJsonSchema(listLocationsSchema);
const createLocationBodyJson = toJsonSchema(createLocationSchema);
const updateLocationBodyJson = toJsonSchema(updateLocationSchema);

const writeRateLimiter = createRateLimiter({
  ...RateLimitPresets.writeOperations,
  keyGenerator: userKeyGenerator,
});

export async function locationRoutes(
  fastify: FastifyInstance,
  controller: LocationController,
): Promise<void> {
  fastify.addHook("onRequest", async (request, reply) => {
    if (request.method !== "GET") {
      await writeRateLimiter(request, reply);
    }
  });

  // List locations
  fastify.get(
    "/locations",
    {
      preValidation: [validateQuery(listLocationsSchema)],
      preHandler: [authenticate, RolePermissions.STAFF_LEVEL],
      schema: {
        description: "List all locations (Staff/Admin only)",
        tags: ["Locations"],
        summary: "List Locations",
        security: [{ bearerAuth: [] }],
        querystring: listLocationsQueryJson,
        response: {
          200: successResponse(paginatedResponse(locationResponseSchema)),
        },
      },
    },
    (request, reply) => controller.listLocations(request as AuthenticatedRequest, reply),
  );

  // Get location
  fastify.get(
    "/locations/:locationId",
    {
      preValidation: [validateParams(locationParamsSchema)],
      preHandler: [authenticate, RolePermissions.STAFF_LEVEL],
      schema: {
        description: "Get location by ID (Staff/Admin only)",
        tags: ["Locations"],
        summary: "Get Location",
        security: [{ bearerAuth: [] }],
        params: locationParamsJson,
        response: {
          200: successResponse(locationResponseSchema),
        },
      },
    },
    (request, reply) => controller.getLocation(request as AuthenticatedRequest, reply),
  );

  // Create location
  fastify.post(
    "/locations",
    {
      preHandler: [authenticate, RolePermissions.ADMIN_ONLY, validateBody(createLocationSchema)],
      schema: {
        description: "Create a new location",
        tags: ["Locations"],
        summary: "Create Location",
        security: [{ bearerAuth: [] }],
        body: createLocationBodyJson,
        response: {
          201: successResponse(locationResponseSchema, 201),
        },
      },
    },
    (request, reply) => controller.createLocation(request as AuthenticatedRequest, reply),
  );

  // Update location
  fastify.patch(
    "/locations/:locationId",
    {
      preValidation: [validateParams(locationParamsSchema)],
      preHandler: [authenticate, RolePermissions.ADMIN_ONLY, validateBody(updateLocationSchema)],
      schema: {
        description: "Update location",
        tags: ["Locations"],
        summary: "Update Location",
        security: [{ bearerAuth: [] }],
        params: locationParamsJson,
        body: updateLocationBodyJson,
        response: {
          200: successResponse(locationResponseSchema),
        },
      },
    },
    (request, reply) => controller.updateLocation(request as AuthenticatedRequest, reply),
  );

  // Delete location
  fastify.delete(
    "/locations/:locationId",
    {
      preValidation: [validateParams(locationParamsSchema)],
      preHandler: [authenticate, RolePermissions.ADMIN_ONLY],
      schema: {
        description: "Delete location",
        tags: ["Locations"],
        summary: "Delete Location",
        security: [{ bearerAuth: [] }],
        params: locationParamsJson,
        response: {
          204: noContentResponse,
        },
      },
    },
    (request, reply) => controller.deleteLocation(request as AuthenticatedRequest, reply),
  );
}
