import { FastifyInstance } from "fastify";
import { ProductController } from "../controllers/product.controller";
import { RolePermissions } from "@/api/src/shared/middleware/role-authorization.middleware";
import {
  listProductsSchema,
  createProductSchema,
  updateProductSchema,
  productParamsSchema,
  productSlugParamsSchema,
  productResponseSchema,
  paginatedProductsResponseSchema,
} from "../schemas/product.schema";

export async function registerProductRoutes(
  fastify: FastifyInstance,
  controller: ProductController,
): Promise<void> {
  // GET /products — List products (public)
  fastify.get(
    "/products",
    {
      schema: {
        description: "Get paginated list of products with filtering options",
        tags: ["Products"],
        summary: "List Products",
        response: { 200: paginatedProductsResponseSchema },
      },
    },
    async (request, reply) => {
      const query = listProductsSchema.parse(request.query);
      return controller.listProducts({ ...request, query } as any, reply);
    },
  );

  // GET /products/slug/:slug — Get by slug (registered before /:productId)
  fastify.get(
    "/products/slug/:slug",
    {
      schema: {
        description: "Get product by slug",
        tags: ["Products"],
        summary: "Get Product by Slug",
        params: { type: "object", required: ["slug"], properties: { slug: { type: "string" } } },
        response: { 200: { type: "object", properties: { success: { type: "boolean" }, data: productResponseSchema } } },
      },
    },
    async (request, reply) => {
      const params = productSlugParamsSchema.parse(request.params);
      return controller.getProductBySlug({ ...request, params } as any, reply);
    },
  );

  // GET /products/:productId — Get by ID (public)
  fastify.get(
    "/products/:productId",
    {
      schema: {
        description: "Get product by ID",
        tags: ["Products"],
        summary: "Get Product by ID",
        params: { type: "object", required: ["productId"], properties: { productId: { type: "string", format: "uuid" } } },
        response: { 200: { type: "object", properties: { success: { type: "boolean" }, data: productResponseSchema } } },
      },
    },
    async (request, reply) => {
      const params = productParamsSchema.parse(request.params);
      return controller.getProduct({ ...request, params } as any, reply);
    },
  );

  // POST /products — Create product (Admin only)
  fastify.post(
    "/products",
    {
      preHandler: [RolePermissions.ADMIN_ONLY],
      schema: {
        description: "Create a new product",
        tags: ["Products"],
        summary: "Create Product",
        security: [{ bearerAuth: [] }],
        response: { 201: { type: "object", properties: { success: { type: "boolean" }, data: productResponseSchema } } },
      },
    },
    async (request, reply) => {
      const body = createProductSchema.parse(request.body);
      return controller.createProduct({ ...request, body } as any, reply);
    },
  );

  // PUT /products/:productId — Update product (Admin only)
  fastify.put(
    "/products/:productId",
    {
      preHandler: [RolePermissions.ADMIN_ONLY],
      schema: {
        description: "Update an existing product",
        tags: ["Products"],
        summary: "Update Product",
        security: [{ bearerAuth: [] }],
        params: { type: "object", required: ["productId"], properties: { productId: { type: "string", format: "uuid" } } },
        response: { 200: { type: "object", properties: { success: { type: "boolean" }, data: productResponseSchema } } },
      },
    },
    async (request, reply) => {
      const params = productParamsSchema.parse(request.params);
      const body = updateProductSchema.parse(request.body);
      return controller.updateProduct({ ...request, params, body } as any, reply);
    },
  );

  // DELETE /products/:productId — Delete product (Admin only)
  fastify.delete(
    "/products/:productId",
    {
      preHandler: [RolePermissions.ADMIN_ONLY],
      schema: {
        description: "Delete a product",
        tags: ["Products"],
        summary: "Delete Product",
        security: [{ bearerAuth: [] }],
        params: { type: "object", required: ["productId"], properties: { productId: { type: "string", format: "uuid" } } },
        response: { 200: { type: "object", properties: { success: { type: "boolean" }, message: { type: "string" } } } },
      },
    },
    async (request, reply) => {
      const params = productParamsSchema.parse(request.params);
      return controller.deleteProduct({ ...request, params } as any, reply);
    },
  );
}
