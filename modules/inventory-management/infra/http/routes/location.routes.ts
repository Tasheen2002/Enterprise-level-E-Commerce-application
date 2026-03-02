import { FastifyInstance } from "fastify";
import { authenticate } from "@/api/src/shared/middleware";
import { RolePermissions } from "@/api/src/shared/middleware";
import { LocationController } from "../controllers/location.controller";

const errorResponses = {
  400: {
    description: "Bad request - validation failed",
    type: "object",
    properties: {
      success: { type: "boolean", example: false },
      error: { type: "string", example: "Validation failed" },
      errors: { type: "array", items: { type: "string" } },
    },
  },
  401: {
    description: "Unauthorized - authentication required",
    type: "object",
    properties: {
      success: { type: "boolean", example: false },
      error: { type: "string", example: "Authentication required" },
    },
  },
  403: {
    description: "Forbidden - insufficient permissions",
    type: "object",
    properties: {
      success: { type: "boolean", example: false },
      error: { type: "string", example: "Insufficient permissions" },
    },
  },
  404: {
    description: "Not found",
    type: "object",
    properties: {
      success: { type: "boolean", example: false },
      error: { type: "string", example: "Resource not found" },
    },
  },
  500: {
    description: "Internal server error",
    type: "object",
    properties: {
      success: { type: "boolean", example: false },
      error: { type: "string", example: "Internal server error" },
    },
  },
};

export async function registerLocationRoutes(
  fastify: FastifyInstance,
  controller: LocationController,
): Promise<void> {
  // List locations
  fastify.get(
    "/locations",
    {
      preHandler: [authenticate, RolePermissions.STAFF_LEVEL],
      schema: {
        description: "List all locations (Staff/Admin only)",
        tags: ["Locations"],
        summary: "List Locations",
        security: [{ bearerAuth: [] }],
        querystring: {
          type: "object",
          properties: {
            limit: { type: "integer", minimum: 1, maximum: 100 },
            offset: { type: "integer", minimum: 0 },
            type: { type: "string", enum: ["warehouse", "store", "vendor"] },
          },
        },
        response: {
          200: {
            description: "List of locations",
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: {
                type: "object",
                properties: {
                  locations: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        locationId: { type: "string" },
                        type: { type: "string" },
                        name: { type: "string" },
                        address: {
                          anyOf: [
                            { type: "null" },
                            {
                              type: "object",
                              properties: {
                                street: { type: "string" },
                                city: { type: "string" },
                                state: { type: "string" },
                                postalCode: { type: "string" },
                                country: { type: "string" },
                              },
                              required: [],
                            },
                          ],
                        },
                      },
                      required: ["locationId", "type", "name"],
                    },
                  },
                  total: { type: "integer" },
                },
                required: ["locations", "total"],
              },
            },
            required: ["success", "data"],
          },
          ...errorResponses,
        },
      },
    },
    controller.listLocations.bind(controller) as any,
  );

  // Get location
  fastify.get(
    "/locations/:locationId",
    {
      preHandler: [authenticate, RolePermissions.STAFF_LEVEL],
      schema: {
        description: "Get location by ID (Staff/Admin only)",
        tags: ["Locations"],
        summary: "Get Location",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          properties: {
            locationId: { type: "string", format: "uuid" },
          },
          required: ["locationId"],
        },
        response: {
          200: { description: "Location details" },
          ...errorResponses,
        },
      },
    },
    controller.getLocation.bind(controller) as any,
  );

  // Create location
  fastify.post(
    "/locations",
    {
      preHandler: [authenticate, RolePermissions.ADMIN_ONLY],
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
          201: { description: "Location created successfully" },
          ...errorResponses,
        },
      },
    },
    controller.createLocation.bind(controller) as any,
  );

  // Update location
  fastify.put(
    "/locations/:locationId",
    {
      preHandler: [authenticate, RolePermissions.ADMIN_ONLY],
      schema: {
        description: "Update location",
        tags: ["Locations"],
        summary: "Update Location",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          properties: {
            locationId: { type: "string", format: "uuid" },
          },
          required: ["locationId"],
        },
        body: {
          type: "object",
          properties: {
            name: { type: "string", minLength: 1, maxLength: 255 },
            address: { type: "object" },
          },
        },
        response: {
          200: { description: "Location updated successfully" },
          ...errorResponses,
        },
      },
    },
    controller.updateLocation.bind(controller) as any,
  );

  // Delete location
  fastify.delete(
    "/locations/:locationId",
    {
      preHandler: [authenticate, RolePermissions.ADMIN_ONLY],
      schema: {
        description: "Delete location",
        tags: ["Locations"],
        summary: "Delete Location",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          properties: {
            locationId: { type: "string", format: "uuid" },
          },
          required: ["locationId"],
        },
        response: {
          200: { description: "Location deleted successfully" },
          ...errorResponses,
        },
      },
    },
    controller.deleteLocation.bind(controller) as any,
  );
}
