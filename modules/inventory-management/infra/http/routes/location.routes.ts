import { FastifyInstance } from "fastify";
import { AuthenticatedRequest } from "@/api/src/shared/interfaces/authenticated-request.interface";
import { authenticate } from "@/api/src/shared/middleware";
import { RolePermissions } from "@/api/src/shared/middleware";
import { LocationController } from "../controllers/location.controller";
import { validateBody, validateParams, validateQuery } from "../validation/validator";
import {
  locationParamsSchema,
  listLocationsSchema,
  createLocationSchema,
  updateLocationSchema,
  locationResponseSchema,
} from "../validation/location.schema";

export async function registerLocationRoutes(
  fastify: FastifyInstance,
  controller: LocationController,
): Promise<void> {
  // List locations
  fastify.get(
    "/locations",
    {
      preHandler: [authenticate, RolePermissions.STAFF_LEVEL, validateQuery(listLocationsSchema)],
      schema: {
        description: "List all locations (Staff/Admin only)",
        tags: ["Locations"],
        summary: "List Locations",
        security: [{ bearerAuth: [] }],
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: {
                type: "object",
                properties: {
                  locations: { type: "array", items: locationResponseSchema },
                  total: { type: "integer" },
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
      preHandler: [authenticate, RolePermissions.STAFF_LEVEL],
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
      preHandler: [authenticate, RolePermissions.ADMIN_ONLY, validateBody(createLocationSchema)],
      schema: {
        description: "Create a new location",
        tags: ["Locations"],
        summary: "Create Location",
        security: [{ bearerAuth: [] }],
        response: {
          201: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: locationResponseSchema,
            },
          },
        },
      },
    },
    (request, reply) => controller.createLocation(request as AuthenticatedRequest, reply),
  );

  // Update location
  fastify.put(
    "/locations/:locationId",
    {
      preValidation: [validateParams(locationParamsSchema)],
      preHandler: [authenticate, RolePermissions.ADMIN_ONLY, validateBody(updateLocationSchema)],
      schema: {
        description: "Update location",
        tags: ["Locations"],
        summary: "Update Location",
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
      preHandler: [authenticate, RolePermissions.ADMIN_ONLY],
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
