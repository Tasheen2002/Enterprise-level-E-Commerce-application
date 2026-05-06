import { FastifyInstance } from "fastify";
import { AuthenticatedRequest } from "@/api/src/shared/interfaces/authenticated-request.interface";
import { authenticate } from "@/api/src/shared/middleware/authenticate.middleware";
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
  toJsonSchema,
} from "../validation/validator";
import {
  successResponse,
  noContentResponse,
  paginatedResponse,
} from "@/api/src/shared/http/response-schemas";
import {
  supplierParamsSchema,
  listSuppliersSchema,
  createSupplierSchema,
  updateSupplierSchema,
  supplierResponseSchema,
} from "../validation/supplier.schema";

// Pre-compute JSON Schemas from Zod (single source of truth — no drift).
const supplierParamsJson = toJsonSchema(supplierParamsSchema);
const listSuppliersQueryJson = toJsonSchema(listSuppliersSchema);
const createSupplierBodyJson = toJsonSchema(createSupplierSchema);
const updateSupplierBodyJson = toJsonSchema(updateSupplierSchema);

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
      preHandler: [authenticate, RolePermissions.STAFF_LEVEL],
      schema: {
        description: "List all suppliers (Staff/Admin only)",
        tags: ["Suppliers"],
        summary: "List Suppliers",
        security: [{ bearerAuth: [] }],
        querystring: listSuppliersQueryJson,
        response: {
          200: successResponse(paginatedResponse(supplierResponseSchema)),
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
      preHandler: [authenticate, RolePermissions.STAFF_LEVEL],
      schema: {
        description: "Get supplier by ID (Staff/Admin only)",
        tags: ["Suppliers"],
        summary: "Get Supplier",
        security: [{ bearerAuth: [] }],
        params: supplierParamsJson,
        response: {
          200: successResponse(supplierResponseSchema),
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
      preHandler: [authenticate, RolePermissions.ADMIN_ONLY, validateBody(createSupplierSchema)],
      schema: {
        description: "Create a new supplier",
        tags: ["Suppliers"],
        summary: "Create Supplier",
        security: [{ bearerAuth: [] }],
        body: createSupplierBodyJson,
        response: {
          201: successResponse(supplierResponseSchema, 201),
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
      preValidation: [validateParams(supplierParamsSchema)],
      preHandler: [authenticate, RolePermissions.ADMIN_ONLY, validateBody(updateSupplierSchema)],
      schema: {
        description: "Update supplier",
        tags: ["Suppliers"],
        summary: "Update Supplier",
        security: [{ bearerAuth: [] }],
        params: supplierParamsJson,
        body: updateSupplierBodyJson,
        response: {
          200: successResponse(supplierResponseSchema),
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
      preHandler: [authenticate, RolePermissions.ADMIN_ONLY],
      schema: {
        description: "Delete supplier",
        tags: ["Suppliers"],
        summary: "Delete Supplier",
        security: [{ bearerAuth: [] }],
        params: supplierParamsJson,
        response: {
          204: noContentResponse,
        },
      },
    },
    (request, reply) =>
      controller.deleteSupplier(request as AuthenticatedRequest, reply),
  );
}
