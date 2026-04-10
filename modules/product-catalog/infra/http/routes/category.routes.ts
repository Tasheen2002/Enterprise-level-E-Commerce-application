import { FastifyInstance } from "fastify";
import { CategoryController } from "../controllers/category.controller";
import { RolePermissions } from "@/api/src/shared/middleware/role-authorization.middleware";
import {
  listCategoriesSchema,
  createCategorySchema,
  updateCategorySchema,
  reorderCategoriesSchema,
  categoryParamsSchema,
  categorySlugParamsSchema,
  categoryResponseSchema,
} from "../schemas/category.schema";

export async function registerCategoryRoutes(
  fastify: FastifyInstance,
  controller: CategoryController,
): Promise<void> {
  // GET /categories — List categories (public)
  fastify.get(
    "/categories",
    {
      schema: {
        description: "Get paginated list of categories",
        tags: ["Categories"],
        summary: "List Categories",
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: {
                type: "object",
                properties: {
                  categories: { type: "array", items: categoryResponseSchema },
                  meta: { type: "object" },
                },
              },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const query = listCategoriesSchema.parse(request.query);
      return controller.getCategories({ ...request, query } as any, reply);
    },
  );

  // GET /categories/hierarchy — Get category tree (registered before /:id)
  fastify.get(
    "/categories/hierarchy",
    {
      schema: {
        description: "Get category hierarchy tree",
        tags: ["Categories"],
        summary: "Get Category Hierarchy",
      },
    },
    controller.getCategoryHierarchy.bind(controller),
  );

  // GET /categories/slug/:slug — Get by slug (registered before /:id)
  fastify.get(
    "/categories/slug/:slug",
    {
      schema: {
        description: "Get category by slug",
        tags: ["Categories"],
        summary: "Get Category by Slug",
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
              data: categoryResponseSchema,
            },
          },
        },
      },
    },
    async (request, reply) => {
      const params = categorySlugParamsSchema.parse(request.params);
      return controller.getCategoryBySlug({ ...request, params } as any, reply);
    },
  );

  // GET /categories/:id — Get by ID (public)
  fastify.get(
    "/categories/:id",
    {
      schema: {
        description: "Get category by ID",
        tags: ["Categories"],
        summary: "Get Category",
        params: {
          type: "object",
          required: ["id"],
          properties: { id: { type: "string", format: "uuid" } },
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: categoryResponseSchema,
            },
          },
        },
      },
    },
    async (request, reply) => {
      const params = categoryParamsSchema.parse(request.params);
      return controller.getCategory({ ...request, params } as any, reply);
    },
  );

  // POST /categories/reorder — Reorder categories (Admin only, before POST /categories)
  fastify.post(
    "/categories/reorder",
    {
      preHandler: [RolePermissions.ADMIN_ONLY],
      schema: {
        description: "Reorder categories by updating positions",
        tags: ["Categories"],
        summary: "Reorder Categories",
        security: [{ bearerAuth: [] }],
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              message: { type: "string" },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const body = reorderCategoriesSchema.parse(request.body);
      return controller.reorderCategories({ ...request, body } as any, reply);
    },
  );

  // POST /categories — Create category (Admin only)
  fastify.post(
    "/categories",
    {
      preHandler: [RolePermissions.ADMIN_ONLY],
      schema: {
        description: "Create a new category",
        tags: ["Categories"],
        summary: "Create Category",
        security: [{ bearerAuth: [] }],
        response: {
          201: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: categoryResponseSchema,
            },
          },
        },
      },
    },
    async (request, reply) => {
      const body = createCategorySchema.parse(request.body);
      return controller.createCategory({ ...request, body } as any, reply);
    },
  );

  // PUT /categories/:id — Update category (Admin only)
  fastify.put(
    "/categories/:id",
    {
      preHandler: [RolePermissions.ADMIN_ONLY],
      schema: {
        description: "Update an existing category",
        tags: ["Categories"],
        summary: "Update Category",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["id"],
          properties: { id: { type: "string", format: "uuid" } },
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: categoryResponseSchema,
            },
          },
        },
      },
    },
    async (request, reply) => {
      const params = categoryParamsSchema.parse(request.params);
      const body = updateCategorySchema.parse(request.body);
      return controller.updateCategory(
        { ...request, params, body } as any,
        reply,
      );
    },
  );

  // DELETE /categories/:id — Delete category (Admin only)
  fastify.delete(
    "/categories/:id",
    {
      preHandler: [RolePermissions.ADMIN_ONLY],
      schema: {
        description: "Delete a category",
        tags: ["Categories"],
        summary: "Delete Category",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["id"],
          properties: { id: { type: "string", format: "uuid" } },
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              message: { type: "string" },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const params = categoryParamsSchema.parse(request.params);
      return controller.deleteCategory({ ...request, params } as any, reply);
    },
  );
}
