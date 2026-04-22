import { FastifyInstance } from "fastify";
import { AuthenticatedRequest } from "@/api/src/shared/interfaces/authenticated-request.interface";
import { RolePermissions } from "@/api/src/shared/middleware/role-authorization.middleware";
import {
  createRateLimiter,
  RateLimitPresets,
  userKeyGenerator,
} from "@/api/src/shared/middleware/rate-limiter.middleware";
import { LocationController } from "../controllers/location.controller";
import { validateBody, validateParams, validateQuery } from "../validation/validator";
import {
  locationParamsSchema,
  listLocationsSchema,
  createLocationSchema,
  updateLocationSchema,
  locationResponseSchema,
} from "../validation/location.schema";

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
      preHandler: [RolePermissions.STAFF_LEVEL],
      schema: {
        description: "List all locations (Staff/Admin only)",
        tags: ["Locations"],
        summary: "List Locations",
        security: [{ bearerAuth: [] }],
        querystring: {
          type: "object",
          properties: {
            limit: { type: "integer", minimum: 1, maximum: 100, default: 20 },
            offset: { type: "integer", minimum: 0, default: 0 },
            type: { type: "string", enum: ["warehouse", "store", "vendor"] },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              statusCode: { type: "number" },
              message: { type: "string" },
              data: {
                type: "object",
                properties: {
                  items: { type: "array", items: locationResponseSchema },
                  total: { type: "integer" },
                  limit: { type: "integer" },
                  offset: { type: "integer" },
                  hasMore: { type: "boolean" },
                },
              },
            },
          },
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
      preHandler: [RolePermissions.STAFF_LEVEL],
      schema: {
        description: "Get location by ID (Staff/Admin only)",
        tags: ["Locations"],
        summary: "Get Location",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          properties: { locationId: { type: "string", format: "uuid" } },
          required: ["locationId"],
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              statusCode: { type: "number" },
              message: { type: "string" },
              data: locationResponseSchema,
            },
          },
        },
      },
    },
    (request, reply) => controller.getLocation(request as AuthenticatedRequest, reply),
  );

  // Create location
  fastify.post(
    "/locations",
    {
      preValidation: [validateBody(createLocationSchema)],
      preHandler: [RolePermissions.ADMIN_ONLY],
      schema: {
        description: "Create a new location",
        tags: ["Locations"],
        summary: "Create Location",
        security: [{ bearerAuth: [] }],
        body: {
          type: "object",
          required: ["type", "name"],
          properties: {
            type: { type: "string", enum: ["warehouse", "store", "vendor"] },
            name: { type: "string", minLength: 1, maxLength: 255 },
            address: {
              type: "object",
              properties: {
                street: { type: "string" },
                city: { type: "string" },
                state: { type: "string" },
                postalCode: { type: "string" },
                country: { type: "string" },
              },
            },
          },
        },
        response: {
          201: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              statusCode: { type: "number" },
              message: { type: "string" },
              data: locationResponseSchema,
            },
          },
        },
      },
    },
    (request, reply) => controller.createLocation(request as AuthenticatedRequest, reply),
  );

  // Update location
  fastify.patch(
    "/locations/:locationId",
    {
      preValidation: [validateParams(locationParamsSchema), validateBody(updateLocationSchema)],
      preHandler: [RolePermissions.ADMIN_ONLY],
      schema: {
        description: "Update location",
        tags: ["Locations"],
        summary: "Update Location",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["locationId"],
          properties: { locationId: { type: "string", format: "uuid" } },
        },
        body: {
          type: "object",
          properties: {
            name: { type: "string", minLength: 1, maxLength: 255 },
            address: {
              type: "object",
              properties: {
                street: { type: "string" },
                city: { type: "string" },
                state: { type: "string" },
                postalCode: { type: "string" },
                country: { type: "string" },
              },
            },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              statusCode: { type: "number" },
              message: { type: "string" },
              data: locationResponseSchema,
            },
          },
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
      preHandler: [RolePermissions.ADMIN_ONLY],
      schema: {
        description: "Delete location",
        tags: ["Locations"],
        summary: "Delete Location",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          properties: { locationId: { type: "string", format: "uuid" } },
          required: ["locationId"],
        },
        response: {
          204: { description: "Location deleted successfully", type: "null" },
        },
      },
    },
    (request, reply) => controller.deleteLocation(request as AuthenticatedRequest, reply),
  );
}
