import { FastifyInstance } from "fastify";
import { AuthenticatedRequest } from "@/api/src/shared/interfaces/authenticated-request.interface";
import { RolePermissions } from "@/api/src/shared/middleware/role-authorization.middleware";
import {
  createRateLimiter,
  RateLimitPresets,
  userKeyGenerator,
} from "@/api/src/shared/middleware/rate-limiter.middleware";
import { SupplierController } from "../controllers/supplier.controller";
import {
  validateBody,
  validateParams,
  validateQuery,
} from "../validation/validator";
import {
  supplierParamsSchema,
  listSuppliersSchema,
  createSupplierSchema,
  updateSupplierSchema,
  supplierResponseSchema,
} from "../validation/supplier.schema";

const writeRateLimiter = createRateLimiter({
  ...RateLimitPresets.writeOperations,
  keyGenerator: userKeyGenerator,
});

export async function supplierRoutes(
  fastify: FastifyInstance,
  controller: SupplierController,
): Promise<void> {
  fastify.addHook("onRequest", async (request, reply) => {
    if (request.method !== "GET") {
      await writeRateLimiter(request, reply);
    }
  });

  // List suppliers
  fastify.get(
    "/suppliers",
    {
      preValidation: [validateQuery(listSuppliersSchema)],
      preHandler: [RolePermissions.STAFF_LEVEL],
      schema: {
        description: "List all suppliers (Staff/Admin only)",
        tags: ["Suppliers"],
        summary: "List Suppliers",
        security: [{ bearerAuth: [] }],
        querystring: {
          type: "object",
          properties: {
            limit: { type: "integer", minimum: 1, maximum: 100, default: 20 },
            offset: { type: "integer", minimum: 0, default: 0 },
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
                  suppliers: { type: "array", items: supplierResponseSchema },
                  total: { type: "integer" },
                },
              },
            },
          },
        },
      },
    },
    (request, reply) =>
      controller.listSuppliers(request as AuthenticatedRequest, reply),
  );

  // Get supplier
  fastify.get(
    "/suppliers/:supplierId",
    {
      preValidation: [validateParams(supplierParamsSchema)],
      preHandler: [RolePermissions.STAFF_LEVEL],
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
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              statusCode: { type: "number" },
              message: { type: "string" },
              data: supplierResponseSchema,
            },
          },
        },
      },
    },
    (request, reply) =>
      controller.getSupplier(request as AuthenticatedRequest, reply),
  );

  // Create supplier
  fastify.post(
    "/suppliers",
    {
      preValidation: [validateBody(createSupplierSchema)],
      preHandler: [RolePermissions.ADMIN_ONLY],
      schema: {
        description: "Create a new supplier",
        tags: ["Suppliers"],
        summary: "Create Supplier",
        security: [{ bearerAuth: [] }],
        body: {
          type: "object",
          required: ["name"],
          properties: {
            name: { type: "string", minLength: 2, maxLength: 128 },
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
          201: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              statusCode: { type: "number" },
              message: { type: "string" },
              data: supplierResponseSchema,
            },
          },
        },
      },
    },
    (request, reply) =>
      controller.createSupplier(request as AuthenticatedRequest, reply),
  );

  // Update supplier
  fastify.patch(
    "/suppliers/:supplierId",
    {
      preValidation: [validateParams(supplierParamsSchema), validateBody(updateSupplierSchema)],
      preHandler: [RolePermissions.ADMIN_ONLY],
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
            name: { type: "string", minLength: 2, maxLength: 128 },
            leadTimeDays: { type: "integer", minimum: 0 },
            contacts: { type: "array" },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              statusCode: { type: "number" },
              message: { type: "string" },
              data: supplierResponseSchema,
            },
          },
        },
      },
    },
    (request, reply) =>
      controller.updateSupplier(request as AuthenticatedRequest, reply),
  );

  // Delete supplier
  fastify.delete(
    "/suppliers/:supplierId",
    {
      preValidation: [validateParams(supplierParamsSchema)],
      preHandler: [RolePermissions.ADMIN_ONLY],
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
          204: { description: "Supplier deleted successfully", type: "null" },
        },
      },
    },
    (request, reply) =>
      controller.deleteSupplier(request as AuthenticatedRequest, reply),
  );
}
