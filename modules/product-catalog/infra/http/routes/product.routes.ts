import { FastifyInstance } from "fastify";
import { AuthenticatedRequest } from "@/api/src/shared/interfaces/authenticated-request.interface";
import { ProductController } from "../controllers/product.controller";
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
  listProductsSchema,
  createProductSchema,
  updateProductSchema,
  productParamsSchema,
  productSlugParamsSchema,
  productResponseSchema,
} from "../validation/product.schema";

const writeRateLimiter = createRateLimiter({
  ...RateLimitPresets.writeOperations,
  keyGenerator: userKeyGenerator,
});

export async function productRoutes(
  fastify: FastifyInstance,
  controller: ProductController,
): Promise<void> {
  fastify.addHook("onRequest", async (request, reply) => {
    if (request.method !== "GET") {
      await writeRateLimiter(request, reply);
    }
  });

  // GET /products — List products (public)
  fastify.get(
    "/products",
    {
      preValidation: [validateQuery(listProductsSchema)],
      schema: {
        description: "Get paginated list of products with filtering options",
        tags: ["Products"],
        summary: "List Products",
        querystring: {
          type: "object",
          properties: {
            page: { type: "integer", minimum: 1, default: 1 },
            limit: { type: "integer", minimum: 1, maximum: 100, default: 20 },
            status: { type: "string", enum: ["draft", "published", "scheduled", "archived"] },
            brand: { type: "string" },
            categoryId: { type: "string", format: "uuid" },
            search: { type: "string" },
            includeDrafts: { type: "boolean", default: false },
            sortBy: { type: "string", enum: ["title", "createdAt", "updatedAt", "publishAt"], default: "createdAt" },
            sortOrder: { type: "string", enum: ["asc", "desc"], default: "desc" },
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
                  products: { type: "array", items: productResponseSchema },
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
        params: {
          type: "object",
          required: ["slug"],
          properties: { slug: { type: "string" } },
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              statusCode: { type: "number" },
              message: { type: "string" },
              data: productResponseSchema,
            },
          },
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
        params: {
          type: "object",
          required: ["productId"],
          properties: { productId: { type: "string", format: "uuid" } },
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              statusCode: { type: "number" },
              message: { type: "string" },
              data: productResponseSchema,
            },
          },
        },
      },
    },
    (request, reply) =>
      controller.getProduct(request as AuthenticatedRequest, reply),
  );

  // POST /products — Create product (Admin only)
  fastify.post(
    "/products",
    {
      preValidation: [validateBody(createProductSchema)],
      preHandler: [RolePermissions.ADMIN_ONLY],
      schema: {
        description: "Create a new product",
        tags: ["Products"],
        summary: "Create Product",
        security: [{ bearerAuth: [] }],
        body: {
          type: "object",
          required: ["title"],
          properties: {
            title: { type: "string" },
            brand: { type: "string" },
            shortDesc: { type: "string" },
            longDescHtml: { type: "string" },
            status: {
              type: "string",
              enum: ["draft", "published", "scheduled"],
            },
            publishAt: { type: "string", format: "date-time" },
            countryOfOrigin: { type: "string" },
            seoTitle: { type: "string" },
            seoDescription: { type: "string" },
            price: { type: "number" },
            priceSgd: { type: "number" },
            priceUsd: { type: "number" },
            compareAtPrice: { type: "number" },
            categoryIds: {
              type: "array",
              items: { type: "string", format: "uuid" },
            },
            tags: { type: "array", items: { type: "string" } },
          },
        },
        response: {
          201: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              statusCode: { type: "number" },
              message: { type: "string" },
              data: productResponseSchema,
            },
          },
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
      preValidation: [validateParams(productParamsSchema), validateBody(updateProductSchema)],
      preHandler: [RolePermissions.ADMIN_ONLY],
      schema: {
        description: "Update an existing product",
        tags: ["Products"],
        summary: "Update Product",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["productId"],
          properties: { productId: { type: "string", format: "uuid" } },
        },
        body: {
          type: "object",
          properties: {
            title: { type: "string" },
            brand: { type: "string" },
            shortDesc: { type: "string" },
            longDescHtml: { type: "string" },
            status: {
              type: "string",
              enum: ["draft", "published", "scheduled"],
            },
            publishAt: { type: "string", format: "date-time" },
            countryOfOrigin: { type: "string" },
            seoTitle: { type: "string" },
            seoDescription: { type: "string" },
            price: { type: "number" },
            priceSgd: { type: "number" },
            priceUsd: { type: "number" },
            compareAtPrice: { type: "number" },
            categoryIds: {
              type: "array",
              items: { type: "string", format: "uuid" },
            },
            tags: { type: "array", items: { type: "string" } },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              statusCode: { type: "number" },
              message: { type: "string" },
              data: productResponseSchema,
            },
          },
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
      preHandler: [RolePermissions.ADMIN_ONLY],
      schema: {
        description: "Delete a product",
        tags: ["Products"],
        summary: "Delete Product",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["productId"],
          properties: { productId: { type: "string", format: "uuid" } },
        },
        response: {
          204: {
            description: "Product deleted successfully",
            type: "null",
          },
        },
      },
    },
    (request, reply) =>
      controller.deleteProduct(request as AuthenticatedRequest, reply),
  );
}
