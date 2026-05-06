import { FastifyInstance } from "fastify";
import { AuthenticatedRequest } from "@/api/src/shared/interfaces/authenticated-request.interface";
import { PreorderController } from "../controllers/preorder.controller";
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
  preorderParamsSchema,
  listPreordersQuerySchema,
  createPreorderSchema,
  updatePreorderReleaseDateSchema,
  preorderResponseSchema,
  paginatedPreordersResponseSchema,
} from "../validation/preorder.schema";

// All preorder writes are admin-only, so userKeyGenerator gives proper
// per-admin buckets — no anonymous-bucket concern here.
const writeRateLimiter = createRateLimiter({
  ...RateLimitPresets.writeOperations,
  keyGenerator: userKeyGenerator,
});

// Pre-compute JSON Schemas from Zod (single source of truth — no drift).
const preorderParamsJson = toJsonSchema(preorderParamsSchema);
const listPreordersQueryJson = toJsonSchema(listPreordersQuerySchema);
const createPreorderBodyJson = toJsonSchema(createPreorderSchema);
const updatePreorderReleaseDateBodyJson = toJsonSchema(updatePreorderReleaseDateSchema);

export async function registerPreorderRoutes(
  fastify: FastifyInstance,
  preorderController: PreorderController,
): Promise<void> {
  fastify.addHook("onRequest", async (request, reply) => {
    if (request.method !== "GET") {
      await writeRateLimiter(request, reply);
    }
  });

  // ── Reads ──

  // List preorders with filtering
  fastify.get(
    "/preorders",
    {
      preValidation: [validateQuery(listPreordersQuerySchema)],
      preHandler: [authenticate, RolePermissions.STAFF_LEVEL],
      schema: {
        description:
          "Get paginated list of preorders with filtering options (all, notified, unnotified, released) (Staff/Admin only)",
        tags: ["Preorders"],
        summary: "List Preorders",
        security: [{ bearerAuth: [] }],
        querystring: listPreordersQueryJson,
        response: {
          200: successResponse(paginatedPreordersResponseSchema),
        },
      },
    },
    (request, reply) =>
      preorderController.listPreorders(request as AuthenticatedRequest, reply),
  );

  // Get preorder by order item ID
  fastify.get(
    "/preorders/:orderItemId",
    {
      preValidation: [validateParams(preorderParamsSchema)],
      preHandler: [authenticate, RolePermissions.STAFF_LEVEL],
      schema: {
        description: "Get preorder details for a specific order item (Staff/Admin only)",
        tags: ["Preorders"],
        summary: "Get Preorder",
        security: [{ bearerAuth: [] }],
        params: preorderParamsJson,
        response: {
          200: successResponse(preorderResponseSchema),
        },
      },
    },
    (request, reply) =>
      preorderController.getPreorder(request as AuthenticatedRequest, reply),
  );

  // ── Writes ──

  // Create preorder for an order item
  fastify.post(
    "/preorders",
    {
      preHandler: [authenticate, RolePermissions.ADMIN_ONLY, validateBody(createPreorderSchema)],
      schema: {
        description:
          "Create a new preorder for an order item. Used for items that will be available in the future.",
        tags: ["Preorders"],
        summary: "Create Preorder",
        security: [{ bearerAuth: [] }],
        body: createPreorderBodyJson,
        response: {
          201: successResponse(preorderResponseSchema, 201),
        },
      },
    },
    (request, reply) =>
      preorderController.createPreorder(request as AuthenticatedRequest, reply),
  );

  // Update preorder release date
  fastify.patch(
    "/preorders/:orderItemId/release-date",
    {
      preValidation: [validateParams(preorderParamsSchema)],
      preHandler: [authenticate, RolePermissions.ADMIN_ONLY, validateBody(updatePreorderReleaseDateSchema)],
      schema: {
        description: "Update the expected release date for a preorder (Admin only)",
        tags: ["Preorders"],
        summary: "Update Preorder Release Date",
        security: [{ bearerAuth: [] }],
        params: preorderParamsJson,
        body: updatePreorderReleaseDateBodyJson,
        response: {
          200: successResponse(preorderResponseSchema),
        },
      },
    },
    (request, reply) =>
      preorderController.updateReleaseDate(request as AuthenticatedRequest, reply),
  );

  // Mark preorder customer as notified
  fastify.post(
    "/preorders/:orderItemId/notify",
    {
      preValidation: [validateParams(preorderParamsSchema)],
      preHandler: [authenticate, RolePermissions.ADMIN_ONLY],
      schema: {
        description: "Mark that the customer has been notified about the preorder (Admin only)",
        tags: ["Preorders"],
        summary: "Mark Preorder as Notified",
        security: [{ bearerAuth: [] }],
        params: preorderParamsJson,
        response: {
          200: successResponse(preorderResponseSchema),
        },
      },
    },
    (request, reply) =>
      preorderController.markNotified(request as AuthenticatedRequest, reply),
  );

  // Delete preorder
  fastify.delete(
    "/preorders/:orderItemId",
    {
      preValidation: [validateParams(preorderParamsSchema)],
      preHandler: [authenticate, RolePermissions.ADMIN_ONLY],
      schema: {
        description: "Delete a preorder (Admin only)",
        tags: ["Preorders"],
        summary: "Delete Preorder",
        security: [{ bearerAuth: [] }],
        params: preorderParamsJson,
        response: {
          204: noContentResponse,
        },
      },
    },
    (request, reply) =>
      preorderController.deletePreorder(request as AuthenticatedRequest, reply),
  );
}
