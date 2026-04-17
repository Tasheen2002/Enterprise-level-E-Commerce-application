import { FastifyInstance } from "fastify";
import { AuthenticatedRequest } from "@/api/src/shared/interfaces/authenticated-request.interface";
import { VariantController } from "../controllers/variant.controller";
import { RolePermissions } from "@/api/src/shared/middleware/role-authorization.middleware";
import {
  createRateLimiter,
  RateLimitPresets,
  userKeyGenerator,
} from "@/api/src/shared/middleware/rate-limiter.middleware";
import {
  validateBody,
  validateParams,
  validateQuery,
} from "../validation/validator";
import {
  listVariantsSchema,
  createVariantSchema,
  updateVariantSchema,
  variantParamsSchema,
  variantByProductParamsSchema,
  variantResponseSchema,
} from "../validation/variant.schema";

const writeRateLimiter = createRateLimiter({
  ...RateLimitPresets.writeOperations,
  keyGenerator: userKeyGenerator,
});

export async function variantRoutes(
  fastify: FastifyInstance,
  controller: VariantController,
): Promise<void> {
  fastify.addHook("onRequest", async (request, reply) => {
    if (request.method !== "GET") {
      await writeRateLimiter(request, reply);
    }
  });

  // GET /products/:productId/variants — List variants for a product (public)
  fastify.get(
    "/products/:productId/variants",
    {
      preValidation: [validateParams(variantByProductParamsSchema), validateQuery(listVariantsSchema)],
      schema: {
        description: "Get variants for a product",
        tags: ["Variants"],
        summary: "List Product Variants",
        params: {
          type: "object",
          required: ["productId"],
          properties: { productId: { type: "string", format: "uuid" } },
        },
        querystring: {
          type: "object",
          properties: {
            page: { type: "integer", minimum: 1, default: 1 },
            limit: { type: "integer", minimum: 1, maximum: 100, default: 20 },
            size: { type: "string" },
            color: { type: "string" },
            sortBy: { type: "string", enum: ["sku", "createdAt", "size", "color"], default: "createdAt" },
            sortOrder: { type: "string", enum: ["asc", "desc"], default: "asc" },
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
                  variants: { type: "array", items: variantResponseSchema },
                  total: { type: "integer" },
                  page: { type: "integer" },
                  limit: { type: "integer" },
                  totalPages: { type: "integer" },
                },
              },
            },
          },
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
        params: {
          type: "object",
          required: ["variantId"],
          properties: { variantId: { type: "string", format: "uuid" } },
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              statusCode: { type: "number" },
              message: { type: "string" },
              data: variantResponseSchema,
            },
          },
        },
      },
    },
    (request, reply) =>
      controller.getVariant(request as AuthenticatedRequest, reply),
  );

  // POST /products/:productId/variants — Create variant (Admin only)
  fastify.post(
    "/products/:productId/variants",
    {
      preValidation: [validateParams(variantByProductParamsSchema), validateBody(createVariantSchema)],
      preHandler: [RolePermissions.ADMIN_ONLY],
      schema: {
        description: "Create a new variant for a product",
        tags: ["Variants"],
        summary: "Create Variant",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["productId"],
          properties: { productId: { type: "string", format: "uuid" } },
        },
        body: {
          type: "object",
          required: ["sku"],
          properties: {
            sku: { type: "string" },
            size: { type: "string" },
            color: { type: "string" },
            barcode: { type: "string" },
            weightG: { type: "integer", minimum: 0 },
            dims: { type: "object" },
            taxClass: { type: "string" },
            allowBackorder: { type: "boolean" },
            allowPreorder: { type: "boolean" },
            restockEta: { type: "string", format: "date-time" },
          },
        },
        response: {
          201: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              statusCode: { type: "number" },
              message: { type: "string" },
              data: variantResponseSchema,
            },
          },
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
      preValidation: [validateParams(variantParamsSchema), validateBody(updateVariantSchema)],
      preHandler: [RolePermissions.ADMIN_ONLY],
      schema: {
        description: "Update an existing variant",
        tags: ["Variants"],
        summary: "Update Variant",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["variantId"],
          properties: { variantId: { type: "string", format: "uuid" } },
        },
        body: {
          type: "object",
          properties: {
            sku: { type: "string" },
            size: { type: "string" },
            color: { type: "string" },
            barcode: { type: "string" },
            weightG: { type: "integer", minimum: 0 },
            dims: { type: "object" },
            taxClass: { type: "string" },
            allowBackorder: { type: "boolean" },
            allowPreorder: { type: "boolean" },
            restockEta: { type: "string", format: "date-time" },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              statusCode: { type: "number" },
              message: { type: "string" },
              data: variantResponseSchema,
            },
          },
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
      preHandler: [RolePermissions.ADMIN_ONLY],
      schema: {
        description: "Delete a variant",
        tags: ["Variants"],
        summary: "Delete Variant",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["variantId"],
          properties: { variantId: { type: "string", format: "uuid" } },
        },
        response: {
          204: {
            description: "Variant deleted successfully",
            type: "null",
          },
        },
      },
    },
    (request, reply) =>
      controller.deleteVariant(request as AuthenticatedRequest, reply),
  );
}
