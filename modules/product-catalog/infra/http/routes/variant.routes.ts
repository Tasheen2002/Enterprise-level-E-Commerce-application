import { FastifyInstance } from "fastify";
import { VariantController } from "../controllers/variant.controller";
import { RolePermissions } from "@/api/src/shared/middleware/role-authorization.middleware";

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
            inStock: { type: "boolean" },
            sortBy: {
              type: "string",
              enum: ["sku", "createdAt", "size", "color"],
              default: "createdAt",
            },
            sortOrder: {
              type: "string",
              enum: ["asc", "desc"],
              default: "asc",
            },
          },
        },
      },
    },
    controller.getVariants.bind(controller) as any,
  );

  // GET /variants/:id — Get variant by ID (public)
  fastify.get(
    "/variants/:id",
    {
      schema: {
        description: "Get variant by ID",
        tags: ["Variants"],
        summary: "Get Variant",
        params: {
          type: "object",
          required: ["id"],
          properties: { id: { type: "string", format: "uuid" } },
        },
      },
    },
    controller.getVariant.bind(controller),
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
        params: {
          type: "object",
          required: ["productId"],
          properties: { productId: { type: "string", format: "uuid" } },
        },
        body: {
          type: "object",
          required: ["sku"],
          properties: {
            sku: { type: "string", description: "Stock Keeping Unit" },
            size: { type: "string", description: "Product size" },
            color: { type: "string", description: "Product color" },
            barcode: { type: "string", description: "Barcode" },
            weightG: {
              type: "integer",
              minimum: 0,
              description: "Weight in grams",
            },
            dims: { type: "object", description: "Dimensions object" },
            taxClass: { type: "string", description: "Tax classification" },
            allowBackorder: { type: "boolean", description: "Allow backorder" },
            allowPreorder: { type: "boolean", description: "Allow preorder" },
            restockEta: {
              type: "string",
              format: "date-time",
              description: "Restock ETA",
            },
          },
        },
      },
    },
    controller.createVariant.bind(controller) as any,
  );

  // PUT /variants/:id — Update variant (Admin only)
  fastify.put(
    "/variants/:id",
    {
      preHandler: [RolePermissions.ADMIN_ONLY],
      schema: {
        description: "Update an existing variant",
        tags: ["Variants"],
        summary: "Update Variant",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["id"],
          properties: { id: { type: "string", format: "uuid" } },
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
      },
    },
    controller.updateVariant.bind(controller) as any,
  );

  // DELETE /variants/:id — Delete variant (Admin only)
  fastify.delete(
    "/variants/:id",
    {
      preHandler: [RolePermissions.ADMIN_ONLY],
      schema: {
        description: "Delete a variant",
        tags: ["Variants"],
        summary: "Delete Variant",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["id"],
          properties: { id: { type: "string", format: "uuid" } },
        },
      },
    },
    controller.deleteVariant.bind(controller) as any,
  );
}
