import { FastifyInstance } from "fastify";
import { CategoryController, CategoryQueryParams, CreateCategoryRequest, UpdateCategoryRequest } from "../controllers/category.controller";
import { RolePermissions } from "@/api/src/shared/middleware/role-authorization.middleware";

export async function registerCategoryRoutes(
  fastify: FastifyInstance,
  controller: CategoryController,
): Promise<void> {
  // GET /categories — List categories (public)
  fastify.get<{ Querystring: CategoryQueryParams }>(
    "/categories",
    {
      schema: {
        description: "Get paginated list of categories with filtering options",
        tags: ["Categories"],
        summary: "List Categories",
        querystring: {
          type: "object",
          properties: {
            page: { type: "integer", minimum: 1, default: 1 },
            limit: { type: "integer", minimum: 1, maximum: 100, default: 50 },
            parentId: { type: "string", format: "uuid" },
            includeChildren: { type: "boolean", default: false },
            sortBy: {
              type: "string",
              enum: ["name", "position", "createdAt"],
              default: "position",
            },
            sortOrder: {
              type: "string",
              enum: ["asc", "desc"],
              default: "asc",
            },
          },
        },
        response: {
          200: {
            description: "List of categories",
            type: "object",
            properties: {
              success: { type: "boolean", example: true },
              data: {
                type: "array",
                items: {
                  type: "object",
                  required: ["id", "name", "slug"],
                  properties: {
                    id: { type: "string" },
                    name: { type: "string" },
                    slug: { type: "string" },
                    parentId: { type: "string", nullable: true },
                    position: { type: "number", nullable: true },
                  },
                },
              },
              meta: {
                type: "object",
                properties: {
                  page: { type: "number" },
                  limit: { type: "number" },
                  parentId: { type: "string", nullable: true },
                  includeChildren: { type: "boolean" },
                  sortBy: { type: "string" },
                  sortOrder: { type: "string" },
                },
              },
            },
          },
        },
      },
    },
    controller.getCategories.bind(controller),
  );

  // GET /categories/hierarchy — Get category tree (public, registered before /:id)
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

  // GET /categories/slug/:slug — Get by slug (public, registered before /:id)
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
      },
    },
    controller.getCategoryBySlug.bind(controller),
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
      },
    },
    controller.getCategory.bind(controller),
  );

  // POST /categories/reorder — Reorder categories (Admin only, registered before POST /categories to keep specificity)
  fastify.post<{ Body: { categoryOrders: Array<{ id: string; position: number }> } }>(
    "/categories/reorder",
    {
      preHandler: [RolePermissions.ADMIN_ONLY],
      schema: {
        description: "Reorder categories by updating positions",
        tags: ["Categories"],
        summary: "Reorder Categories",
        security: [{ bearerAuth: [] }],
        body: {
          type: "object",
          required: ["categoryOrders"],
          properties: {
            categoryOrders: {
              type: "array",
              items: {
                type: "object",
                required: ["id", "position"],
                properties: {
                  id: { type: "string", format: "uuid" },
                  position: { type: "integer", minimum: 0 },
                },
              },
            },
          },
        },
      },
    },
    controller.reorderCategories.bind(controller),
  );

  // POST /categories — Create category (Admin only)
  fastify.post<{ Body: CreateCategoryRequest }>(
    "/categories",
    {
      preHandler: [RolePermissions.ADMIN_ONLY],
      schema: {
        description: "Create a new category",
        tags: ["Categories"],
        summary: "Create Category",
        security: [{ bearerAuth: [] }],
        body: {
          type: "object",
          required: ["name"],
          properties: {
            name: { type: "string", description: "Category name" },
            parentId: {
              type: "string",
              format: "uuid",
              description: "Parent category ID",
            },
            position: {
              type: "integer",
              minimum: 0,
              description: "Display position",
            },
          },
        },
        response: {
          201: {
            description: "Category created successfully",
            type: "object",
            properties: {
              success: { type: "boolean", example: true },
              data: {
                type: "object",
                properties: {
                  id: { type: "string", format: "uuid" },
                  name: { type: "string" },
                },
              },
              message: {
                type: "string",
                example: "Category created successfully",
              },
            },
          },
        },
      },
    },
    controller.createCategory.bind(controller),
  );

  // PUT /categories/:id — Update category (Admin only)
  fastify.put<{ Params: { id: string }; Body: UpdateCategoryRequest }>(
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
        body: {
          type: "object",
          properties: {
            name: { type: "string" },
            parentId: { type: "string", format: "uuid" },
            position: { type: "integer", minimum: 0 },
          },
        },
      },
    },
    controller.updateCategory.bind(controller),
  );

  // DELETE /categories/:id — Delete category (Admin only)
  fastify.delete<{ Params: { id: string } }>(
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
      },
    },
    controller.deleteCategory.bind(controller),
  );
}
