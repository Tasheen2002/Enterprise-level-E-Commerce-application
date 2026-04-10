import { FastifyInstance } from "fastify";
import { VariantController } from "../controllers/variant.controller";
import { RolePermissions } from "@/api/src/shared/middleware/role-authorization.middleware";
import {
  listVariantsSchema,
  createVariantSchema,
  updateVariantSchema,
  variantParamsSchema,
  variantByProductParamsSchema,
  variantResponseSchema,
} from "../schemas/variant.schema";

export async function registerVariantRoutes(
  fastify: FastifyInstance,
  controller: VariantController,
): Promise<void> {
  // GET /products/:productId/variants — List variants for a product (public)
  fastify.get(
    "/products/:productId/variants",
    {
      schema: {
        description: "Get variants for a product",
        tags: ["Variants"],
        summary: "List Product Variants",
        params: { type: "object", required: ["productId"], properties: { productId: { type: "string", format: "uuid" } } },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: { type: "object", properties: { variants: { type: "array", items: variantResponseSchema }, meta: { type: "object" } } },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const params = variantByProductParamsSchema.parse(request.params);
      const query = listVariantsSchema.parse(request.query);
      return controller.getVariants({ ...request, params, query } as any, reply);
    },
  );

  // GET /variants/:variantId — Get variant by ID (public)
  fastify.get(
    "/variants/:variantId",
    {
      schema: {
        description: "Get variant by ID",
        tags: ["Variants"],
        summary: "Get Variant",
        params: { type: "object", required: ["variantId"], properties: { variantId: { type: "string", format: "uuid" } } },
        response: { 200: { type: "object", properties: { success: { type: "boolean" }, data: variantResponseSchema } } },
      },
    },
    async (request, reply) => {
      const params = variantParamsSchema.parse(request.params);
      return controller.getVariant({ ...request, params } as any, reply);
    },
  );

  // POST /products/:productId/variants — Create variant (Admin only)
  fastify.post(
    "/products/:productId/variants",
    {
      preHandler: [RolePermissions.ADMIN_ONLY],
      schema: {
        description: "Create a new variant for a product",
        tags: ["Variants"],
        summary: "Create Variant",
        security: [{ bearerAuth: [] }],
        params: { type: "object", required: ["productId"], properties: { productId: { type: "string", format: "uuid" } } },
        response: { 201: { type: "object", properties: { success: { type: "boolean" }, data: variantResponseSchema } } },
      },
    },
    async (request, reply) => {
      const params = variantByProductParamsSchema.parse(request.params);
      const body = createVariantSchema.parse(request.body);
      return controller.createVariant({ ...request, params, body } as any, reply);
    },
  );

  // PUT /variants/:variantId — Update variant (Admin only)
  fastify.put(
    "/variants/:variantId",
    {
      preHandler: [RolePermissions.ADMIN_ONLY],
      schema: {
        description: "Update an existing variant",
        tags: ["Variants"],
        summary: "Update Variant",
        security: [{ bearerAuth: [] }],
        params: { type: "object", required: ["variantId"], properties: { variantId: { type: "string", format: "uuid" } } },
        response: { 200: { type: "object", properties: { success: { type: "boolean" }, data: variantResponseSchema } } },
      },
    },
    async (request, reply) => {
      const params = variantParamsSchema.parse(request.params);
      const body = updateVariantSchema.parse(request.body);
      return controller.updateVariant({ ...request, params, body } as any, reply);
    },
  );

  // DELETE /variants/:variantId — Delete variant (Admin only)
  fastify.delete(
    "/variants/:variantId",
    {
      preHandler: [RolePermissions.ADMIN_ONLY],
      schema: {
        description: "Delete a variant",
        tags: ["Variants"],
        summary: "Delete Variant",
        security: [{ bearerAuth: [] }],
        params: { type: "object", required: ["variantId"], properties: { variantId: { type: "string", format: "uuid" } } },
        response: { 200: { type: "object", properties: { success: { type: "boolean" }, message: { type: "string" } } } },
      },
    },
    async (request, reply) => {
      const params = variantParamsSchema.parse(request.params);
      return controller.deleteVariant({ ...request, params } as any, reply);
    },
  );
}
