import { FastifyInstance } from "fastify";
import { authenticate } from "@/api/src/shared/middleware";
import { RolePermissions } from "@/api/src/shared/middleware";
import { SupplierController } from "../controllers/supplier.controller";

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

export async function registerSupplierRoutes(
  fastify: FastifyInstance,
  controller: SupplierController,
): Promise<void> {
  // List suppliers
  fastify.get(
    "/suppliers",
    {
      preHandler: [authenticate, RolePermissions.STAFF_LEVEL],
      schema: {
        description: "List all suppliers (Staff/Admin only)",
        tags: ["Suppliers"],
        summary: "List Suppliers",
        security: [{ bearerAuth: [] }],
        querystring: {
          type: "object",
          properties: {
            limit: { type: "integer", minimum: 1, maximum: 100 },
            offset: { type: "integer", minimum: 0 },
          },
        },
        response: {
          200: { description: "List of suppliers" },
          ...errorResponses,
        },
      },
    },
    controller.listSuppliers.bind(controller) as any,
  );

  // Get supplier
  fastify.get(
    "/suppliers/:supplierId",
    {
      preHandler: [authenticate, RolePermissions.STAFF_LEVEL],
      schema: {
        description: "Get supplier by ID (Staff/Admin only)",
        tags: ["Suppliers"],
        summary: "Get Supplier",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          properties: {
            supplierId: { type: "string", format: "uuid" },
          },
          required: ["supplierId"],
        },
        response: {
          200: { description: "Supplier details" },
          ...errorResponses,
        },
      },
    },
    controller.getSupplier.bind(controller) as any,
  );

  // Create supplier
  fastify.post(
    "/suppliers",
    {
      preHandler: [authenticate, RolePermissions.ADMIN_ONLY],
      schema: {
        description: "Create a new supplier",
        tags: ["Suppliers"],
        summary: "Create Supplier",
        security: [{ bearerAuth: [] }],
        body: {
          type: "object",
          required: ["name"],
          properties: {
            name: { type: "string", minLength: 1, maxLength: 255 },
            leadTimeDays: { type: "integer", minimum: 0 },
            contacts: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  email: { type: "string", format: "email" },
                  phone: { type: "string" },
                },
              },
            },
          },
        },
        response: {
          201: { description: "Supplier created successfully" },
          ...errorResponses,
        },
      },
    },
    controller.createSupplier.bind(controller) as any,
  );

  // Update supplier
  fastify.put(
    "/suppliers/:supplierId",
    {
      preHandler: [authenticate, RolePermissions.ADMIN_ONLY],
      schema: {
        description: "Update supplier",
        tags: ["Suppliers"],
        summary: "Update Supplier",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          properties: {
            supplierId: { type: "string", format: "uuid" },
          },
          required: ["supplierId"],
        },
        body: {
          type: "object",
          properties: {
            name: { type: "string", minLength: 1, maxLength: 255 },
            leadTimeDays: { type: "integer", minimum: 0 },
            contacts: { type: "array" },
          },
        },
        response: {
          200: { description: "Supplier updated successfully" },
          ...errorResponses,
        },
      },
    },
    controller.updateSupplier.bind(controller) as any,
  );

  // Delete supplier
  fastify.delete(
    "/suppliers/:supplierId",
    {
      preHandler: [authenticate, RolePermissions.ADMIN_ONLY],
      schema: {
        description: "Delete supplier",
        tags: ["Suppliers"],
        summary: "Delete Supplier",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          properties: {
            supplierId: { type: "string", format: "uuid" },
          },
          required: ["supplierId"],
        },
        response: {
          200: { description: "Supplier deleted successfully" },
          ...errorResponses,
        },
      },
    },
    controller.deleteSupplier.bind(controller) as any,
  );
}
