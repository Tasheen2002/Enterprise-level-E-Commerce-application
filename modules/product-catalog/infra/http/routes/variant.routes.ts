import { FastifyInstance } from "fastify";
import { AuthenticatedRequest } from "@/api/src/shared/interfaces/authenticated-request.interface";
import { VariantController } from "../controllers/variant.controller";
import { RolePermissions } from "@/api/src/shared/middleware/role-authorization.middleware";
import { authenticate } from "@/api/src/shared/middleware/authenticate.middleware";
import {
  createRateLimiter,
  RateLimitPresets,
  userKeyGenerator,
} from "@/api/src/shared/middleware/rate-limiter.middleware";
import {
  validateBody,
  validateParams,
  validateQuery,
  toJsonSchema,
} from "../validation/validator";
import {
  successResponse,
  noContentResponse,
} from "@/api/src/shared/http/response-schemas";
import {
  listVariantsSchema,
  createVariantSchema,
  updateVariantSchema,
  variantParamsSchema,
  variantByProductParamsSchema,
  variantResponseSchema,
  paginatedVariantsResponseSchema,
} from "../validation/variant.schema";

const writeRateLimiter = createRateLimiter({
  ...RateLimitPresets.writeOperations,
  keyGenerator: userKeyGenerator,
});

// Pre-compute JSON Schemas from Zod (single source of truth — no drift).
const variantParamsJson = toJsonSchema(variantParamsSchema);
const variantByProductParamsJson = toJsonSchema(variantByProductParamsSchema);
const listVariantsQueryJson = toJsonSchema(listVariantsSchema);
const createVariantBodyJson = toJsonSchema(createVariantSchema);
const updateVariantBodyJson = toJsonSchema(updateVariantSchema);

export async function variantRoutes(
  fastify: FastifyInstance,
  controller: VariantController,
): Promise<void> {
  fastify.addHook("onRequest", async (request, reply) => {
    if (request.method !== "GET") {
      await writeRateLimiter(request, reply);
    }
  });

  // ── Reads ──────────────────────────────────────────────────────────────

  // GET /products/:productId/variants — List variants for a product (public)
  fastify.get(
    "/products/:productId/variants",
    {
      preValidation: [
        validateParams(variantByProductParamsSchema),
        validateQuery(listVariantsSchema),
      ],
      schema: {
        description: "Get variants for a product",
        tags: ["Variants"],
        summary: "List Product Variants",
        params: variantByProductParamsJson,
        querystring: listVariantsQueryJson,
        response: {
          200: successResponse(paginatedVariantsResponseSchema),
        },
      },
    },
    (request, reply) =>
      controller.getVariants(request as AuthenticatedRequest, reply),
  );

  // GET /variants/:variantId — Get variant by ID (public)
  fastify.get(
    "/variants/:variantId",
    {
      preValidation: [validateParams(variantParamsSchema)],
      schema: {
        description: "Get variant by ID",
        tags: ["Variants"],
        summary: "Get Variant",
        params: variantParamsJson,
        response: {
          200: successResponse(variantResponseSchema),
        },
      },
    },
    (request, reply) =>
      controller.getVariant(request as AuthenticatedRequest, reply),
  );

  // ── Writes ─────────────────────────────────────────────────────────────

  // POST /products/:productId/variants — Create variant (Admin only)
  fastify.post(
    "/products/:productId/variants",
    {
      preValidation: [validateParams(variantByProductParamsSchema)],
      preHandler: [authenticate, RolePermissions.ADMIN_ONLY, validateBody(createVariantSchema)],
      schema: {
        description: "Create a new variant for a product",
        tags: ["Variants"],
        summary: "Create Variant",
        security: [{ bearerAuth: [] }],
        params: variantByProductParamsJson,
        body: createVariantBodyJson,
        response: {
          201: successResponse(variantResponseSchema, 201),
        },
      },
    },
    (request, reply) =>
      controller.createVariant(request as AuthenticatedRequest, reply),
  );

  // PATCH /variants/:variantId — Update variant (Admin only)
  fastify.patch(
    "/variants/:variantId",
    {
      preValidation: [validateParams(variantParamsSchema)],
      preHandler: [authenticate, RolePermissions.ADMIN_ONLY, validateBody(updateVariantSchema)],
      schema: {
        description: "Update an existing variant",
        tags: ["Variants"],
        summary: "Update Variant",
        security: [{ bearerAuth: [] }],
        params: variantParamsJson,
        body: updateVariantBodyJson,
        response: {
          200: successResponse(variantResponseSchema),
        },
      },
    },
    (request, reply) =>
      controller.updateVariant(request as AuthenticatedRequest, reply),
  );

  // DELETE /variants/:variantId — Delete variant (Admin only)
  fastify.delete(
    "/variants/:variantId",
    {
      preValidation: [validateParams(variantParamsSchema)],
      preHandler: [authenticate, RolePermissions.ADMIN_ONLY],
      schema: {
        description: "Delete a variant",
        tags: ["Variants"],
        summary: "Delete Variant",
        security: [{ bearerAuth: [] }],
        params: variantParamsJson,
        response: {
          204: noContentResponse,
        },
      },
    },
    (request, reply) =>
      controller.deleteVariant(request as AuthenticatedRequest, reply),
  );
}
