import { FastifyInstance } from "fastify";
import { AuthenticatedRequest } from "@/api/src/shared/interfaces/authenticated-request.interface";
import { ProductController } from "../controllers/product.controller";
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
  listProductsSchema,
  createProductSchema,
  updateProductSchema,
  productParamsSchema,
  productSlugParamsSchema,
  productResponseSchema,
  paginatedProductsResponseSchema,
} from "../validation/product.schema";

const writeRateLimiter = createRateLimiter({
  ...RateLimitPresets.writeOperations,
  keyGenerator: userKeyGenerator,
});

// Pre-compute JSON Schemas from Zod (single source of truth — no drift).
const productParamsJson = toJsonSchema(productParamsSchema);
const productSlugParamsJson = toJsonSchema(productSlugParamsSchema);
const listProductsQueryJson = toJsonSchema(listProductsSchema);
const createProductBodyJson = toJsonSchema(createProductSchema);
const updateProductBodyJson = toJsonSchema(updateProductSchema);

export async function productRoutes(
  fastify: FastifyInstance,
  controller: ProductController,
): Promise<void> {
  fastify.addHook("onRequest", async (request, reply) => {
    if (request.method !== "GET") {
      await writeRateLimiter(request, reply);
    }
  });

  // ── Reads ──────────────────────────────────────────────────────────────

  // GET /products — List products (public).
  // Search lives at /search (SearchController) — do not advertise a `search` field here.
  fastify.get(
    "/products",
    {
      preValidation: [validateQuery(listProductsSchema)],
      schema: {
        description: "Get paginated list of products with filtering options",
        tags: ["Products"],
        summary: "List Products",
        querystring: listProductsQueryJson,
        response: {
          200: successResponse(paginatedProductsResponseSchema),
        },
      },
    },
    (request, reply) =>
      controller.listProducts(request as AuthenticatedRequest, reply),
  );

  // GET /products/slug/:slug — Get by slug (registered before /:productId)
  fastify.get(
    "/products/slug/:slug",
    {
      preValidation: [validateParams(productSlugParamsSchema)],
      schema: {
        description: "Get product by slug",
        tags: ["Products"],
        summary: "Get Product by Slug",
        params: productSlugParamsJson,
        response: {
          200: successResponse(productResponseSchema),
        },
      },
    },
    (request, reply) =>
      controller.getProductBySlug(request as AuthenticatedRequest, reply),
  );

  // GET /products/:productId — Get by ID (public)
  fastify.get(
    "/products/:productId",
    {
      preValidation: [validateParams(productParamsSchema)],
      schema: {
        description: "Get product by ID",
        tags: ["Products"],
        summary: "Get Product by ID",
        params: productParamsJson,
        response: {
          200: successResponse(productResponseSchema),
        },
      },
    },
    (request, reply) =>
      controller.getProduct(request as AuthenticatedRequest, reply),
  );

  // ── Writes ─────────────────────────────────────────────────────────────

  // POST /products — Create product (Admin only)
  fastify.post(
    "/products",
    {
      preHandler: [authenticate, RolePermissions.ADMIN_ONLY, validateBody(createProductSchema)],
      schema: {
        description: "Create a new product",
        tags: ["Products"],
        summary: "Create Product",
        security: [{ bearerAuth: [] }],
        body: createProductBodyJson,
        response: {
          201: successResponse(productResponseSchema, 201),
        },
      },
    },
    (request, reply) =>
      controller.createProduct(request as AuthenticatedRequest, reply),
  );

  // PATCH /products/:productId — Update product (Admin only)
  fastify.patch(
    "/products/:productId",
    {
      preValidation: [validateParams(productParamsSchema)],
      preHandler: [authenticate, RolePermissions.ADMIN_ONLY, validateBody(updateProductSchema)],
      schema: {
        description: "Update an existing product",
        tags: ["Products"],
        summary: "Update Product",
        security: [{ bearerAuth: [] }],
        params: productParamsJson,
        body: updateProductBodyJson,
        response: {
          200: successResponse(productResponseSchema),
        },
      },
    },
    (request, reply) =>
      controller.updateProduct(request as AuthenticatedRequest, reply),
  );

  // DELETE /products/:productId — Delete product (Admin only)
  fastify.delete(
    "/products/:productId",
    {
      preValidation: [validateParams(productParamsSchema)],
      preHandler: [authenticate, RolePermissions.ADMIN_ONLY],
      schema: {
        description: "Delete a product",
        tags: ["Products"],
        summary: "Delete Product",
        security: [{ bearerAuth: [] }],
        params: productParamsJson,
        response: {
          204: noContentResponse,
        },
      },
    },
    (request, reply) =>
      controller.deleteProduct(request as AuthenticatedRequest, reply),
  );
}
