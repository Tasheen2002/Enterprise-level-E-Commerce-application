import { FastifyInstance } from "fastify";
import { AuthenticatedRequest } from "@/api/src/shared/interfaces/authenticated-request.interface";
import { BackorderController } from "../controllers/backorder.controller";
import { authenticate } from "@/api/src/shared/middleware/authenticate.middleware";
import { RolePermissions } from "@/api/src/shared/middleware/role-authorization.middleware";
import {
  createRateLimiter,
  RateLimitPresets,
  userKeyGenerator,
} from "@/api/src/shared/middleware/rate-limiter.middleware";
import { validateBody, validateParams, validateQuery, toJsonSchema } from "../validation/validator";
import {
  successResponse,
  noContentResponse,
} from "@/api/src/shared/http/response-schemas";
import {
  backorderParamsSchema,
  listBackordersQuerySchema,
  createBackorderSchema,
  updateBackorderEtaSchema,
  backorderResponseSchema,
  paginatedBackordersResponseSchema,
} from "../validation/backorder.schema";

// All backorder writes are admin-only, so userKeyGenerator gives proper
// per-admin buckets — no anonymous-bucket concern here.
const writeRateLimiter = createRateLimiter({
  ...RateLimitPresets.writeOperations,
  keyGenerator: userKeyGenerator,
});

// Pre-compute JSON Schemas from Zod (single source of truth — no drift).
const backorderParamsJson = toJsonSchema(backorderParamsSchema);
const listBackordersQueryJson = toJsonSchema(listBackordersQuerySchema);
const createBackorderBodyJson = toJsonSchema(createBackorderSchema);
const updateBackorderEtaBodyJson = toJsonSchema(updateBackorderEtaSchema);

export async function registerBackorderRoutes(
  fastify: FastifyInstance,
  backorderController: BackorderController,
): Promise<void> {
  fastify.addHook("onRequest", async (request, reply) => {
    if (request.method !== "GET") {
      await writeRateLimiter(request, reply);
    }
  });

  // ── Reads ──

  // List backorders with filtering
  fastify.get(
    "/backorders",
    {
      preValidation: [validateQuery(listBackordersQuerySchema)],
      preHandler: [authenticate, RolePermissions.STAFF_LEVEL],
      schema: {
        description:
          "Get paginated list of backorders with filtering options (all, notified, unnotified, overdue) (Staff/Admin only)",
        tags: ["Backorders"],
        summary: "List Backorders",
        security: [{ bearerAuth: [] }],
        querystring: listBackordersQueryJson,
        response: {
          200: successResponse(paginatedBackordersResponseSchema),
        },
      },
    },
    (request, reply) =>
      backorderController.listBackorders(request as AuthenticatedRequest, reply),
  );

  // Get backorder by order item ID
  fastify.get(
    "/backorders/:orderItemId",
    {
      preValidation: [validateParams(backorderParamsSchema)],
      preHandler: [authenticate, RolePermissions.STAFF_LEVEL],
      schema: {
        description: "Get backorder details for a specific order item (Staff/Admin only)",
        tags: ["Backorders"],
        summary: "Get Backorder",
        security: [{ bearerAuth: [] }],
        params: backorderParamsJson,
        response: {
          200: successResponse(backorderResponseSchema),
        },
      },
    },
    (request, reply) =>
      backorderController.getBackorder(request as AuthenticatedRequest, reply),
  );

  // ── Writes ──

  // Create backorder for an order item
  fastify.post(
    "/backorders",
    {
      preHandler: [authenticate, RolePermissions.ADMIN_ONLY, validateBody(createBackorderSchema)],
      schema: {
        description:
          "Create a new backorder for an order item. Used for items that are temporarily out of stock.",
        tags: ["Backorders"],
        summary: "Create Backorder",
        security: [{ bearerAuth: [] }],
        body: createBackorderBodyJson,
        response: {
          201: successResponse(backorderResponseSchema, 201),
        },
      },
    },
    (request, reply) =>
      backorderController.createBackorder(request as AuthenticatedRequest, reply),
  );

  // Update backorder promised ETA
  fastify.patch(
    "/backorders/:orderItemId/eta",
    {
      preValidation: [validateParams(backorderParamsSchema)],
      preHandler: [authenticate, RolePermissions.ADMIN_ONLY, validateBody(updateBackorderEtaSchema)],
      schema: {
        description: "Update the promised ETA for a backorder (Admin only)",
        tags: ["Backorders"],
        summary: "Update Backorder ETA",
        security: [{ bearerAuth: [] }],
        params: backorderParamsJson,
        body: updateBackorderEtaBodyJson,
        response: {
          200: successResponse(backorderResponseSchema),
        },
      },
    },
    (request, reply) =>
      backorderController.updatePromisedEta(request as AuthenticatedRequest, reply),
  );

  // Mark backorder customer as notified
  fastify.post(
    "/backorders/:orderItemId/notify",
    {
      preValidation: [validateParams(backorderParamsSchema)],
      preHandler: [authenticate, RolePermissions.ADMIN_ONLY],
      schema: {
        description: "Mark that the customer has been notified about the backorder (Admin only)",
        tags: ["Backorders"],
        summary: "Mark Backorder as Notified",
        security: [{ bearerAuth: [] }],
        params: backorderParamsJson,
        response: {
          200: successResponse(backorderResponseSchema),
        },
      },
    },
    (request, reply) =>
      backorderController.markNotified(request as AuthenticatedRequest, reply),
  );

  // Delete backorder
  fastify.delete(
    "/backorders/:orderItemId",
    {
      preValidation: [validateParams(backorderParamsSchema)],
      preHandler: [authenticate, RolePermissions.ADMIN_ONLY],
      schema: {
        description: "Delete a backorder (Admin only)",
        tags: ["Backorders"],
        summary: "Delete Backorder",
        security: [{ bearerAuth: [] }],
        params: backorderParamsJson,
        response: {
          204: noContentResponse,
        },
      },
    },
    (request, reply) =>
      backorderController.deleteBackorder(request as AuthenticatedRequest, reply),
  );
}
