import { FastifyRequest, FastifyReply } from "fastify";
import { CategoryManagementService } from "../../../application/services/category-management.service";

interface CreateCategoryRequest {
  name: string;
  parentId?: string;
  position?: number;
}

interface UpdateCategoryRequest extends Partial<CreateCategoryRequest> {}

interface CategoryQueryParams {
  page?: number;
  limit?: number;
  parentId?: string;
  includeChildren?: boolean;
  sortBy?: "name" | "position" | "createdAt";
  sortOrder?: "asc" | "desc";
}

export class CategoryController {
  constructor(
    private readonly categoryManagementService: CategoryManagementService,
  ) {}

  async getCategories(
    request: FastifyRequest<{ Querystring: CategoryQueryParams }>,
    reply: FastifyReply,
  ) {
    try {
      const {
        page = 1,
        limit = 50,
        parentId,
        includeChildren = false,
        sortBy = "position",
        sortOrder = "asc",
      } = request.query;

      const options = {
        page: Math.max(1, page),
        limit: Math.min(100, Math.max(1, limit)),
        parentId,
        includeChildren,
        sortBy,
        sortOrder,
      };

      const categories =
        await this.categoryManagementService.getCategories(options);
      const mappedData = categories.map((category) => category.toData());

      return {
        success: true,
        data: mappedData,
        meta: {
          page: options.page,
          limit: options.limit,
          parentId: options.parentId || null,
          includeChildren: options.includeChildren,
          sortBy: options.sortBy,
          sortOrder: options.sortOrder,
        },
      };
    } catch (error) {
      request.log.error(error, "Failed to get categories");
      return reply.code(500).send({
        success: false,
        error: "Internal server error",
        message: "Failed to retrieve categories",
      });
    }
  }

  async getCategory(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const { id } = request.params;

      if (!id || typeof id !== "string") {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: "Category ID is required and must be a valid string",
        });
      }

      const category = await this.categoryManagementService.getCategoryById(id);

      if (!category) {
        return reply.code(404).send({
          success: false,
          error: "Not Found",
          message: "Category not found",
        });
      }

      return reply.code(200).send({
        success: true,
        data: category.toData(),
      });
    } catch (error) {
      request.log.error(error, "Failed to get category");
      return reply.code(500).send({
        success: false,
        error: "Internal server error",
        message: "Failed to retrieve category",
      });
    }
  }

  async getCategoryBySlug(
    request: FastifyRequest<{ Params: { slug: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const { slug } = request.params;

      if (!slug || typeof slug !== "string") {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: "Category slug is required and must be a valid string",
        });
      }

      const category =
        await this.categoryManagementService.getCategoryBySlug(slug);

      if (!category) {
        return reply.code(404).send({
          success: false,
          error: "Not Found",
          message: "Category not found",
        });
      }

      return reply.code(200).send({
        success: true,
        data: category.toData(),
      });
    } catch (error) {
      request.log.error(error, "Failed to get category by slug");
      return reply.code(500).send({
        success: false,
        error: "Internal server error",
        message: "Failed to retrieve category",
      });
    }
  }

  async createCategory(
    request: FastifyRequest<{ Body: CreateCategoryRequest }>,
    reply: FastifyReply,
  ) {
    try {
      const categoryData = request.body;

      // Basic validation
      if (
        !categoryData.name ||
        typeof categoryData.name !== "string" ||
        categoryData.name.trim().length === 0
      ) {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: "Category name is required and must be a non-empty string",
        });
      }

      // Validate parentId if provided
      if (categoryData.parentId && typeof categoryData.parentId !== "string") {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: "Parent ID must be a valid string",
        });
      }

      // Validate position if provided
      if (
        categoryData.position !== undefined &&
        (!Number.isInteger(categoryData.position) || categoryData.position < 0)
      ) {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: "Position must be a non-negative integer",
        });
      }

      const category =
        await this.categoryManagementService.createCategory(categoryData);

      return reply.code(201).send({
        success: true,
        data: category.toData(),
        message: "Category created successfully",
      });
    } catch (error) {
      request.log.error(error, "Failed to create category");

      if (error instanceof Error) {
        console.log("Category creation error:", error.message); // Debug log

        if (
          error instanceof Error &&
          (error.message.includes("duplicate") ||
            error.message.includes("unique"))
        ) {
          return reply.code(409).send({
            success: false,
            error: "Conflict",
            message: "Category with this name or slug already exists",
          });
        }

        if (
          error.message.includes("parent") ||
          error.message.includes("not found")
        ) {
          return reply.code(400).send({
            success: false,
            error: "Bad Request",
            message: "Parent category not found",
          });
        }

        if (
          error.message.includes("circular") ||
          error.message.includes("hierarchy")
        ) {
          return reply.code(400).send({
            success: false,
            error: "Bad Request",
            message:
              "Invalid category hierarchy - would create circular reference",
          });
        }

        if (error.message.includes("UUID") || error.message.includes("uuid")) {
          return reply.code(400).send({
            success: false,
            error: "Bad Request",
            message: "Invalid parent ID format - must be a valid UUID",
          });
        }

        // Return the actual error message for debugging
        return reply.code(500).send({
          success: false,
          error: "Internal server error",
          message: error.message,
        });
      }

      return reply.code(500).send({
        success: false,
        error: "Internal server error",
        message: "Failed to create category",
      });
    }
  }

  async updateCategory(
    request: FastifyRequest<{
      Params: { id: string };
      Body: UpdateCategoryRequest;
    }>,
    reply: FastifyReply,
  ) {
    try {
      const { id } = request.params;
      const updateData = request.body;

      if (!id || typeof id !== "string") {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: "Category ID is required and must be a valid string",
        });
      }

      // Validate name if provided
      if (
        updateData.name !== undefined &&
        (typeof updateData.name !== "string" ||
          updateData.name.trim().length === 0)
      ) {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: "Category name must be a non-empty string",
        });
      }

      // Validate parentId if provided
      if (
        updateData.parentId !== undefined &&
        typeof updateData.parentId !== "string"
      ) {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: "Parent ID must be a valid string",
        });
      }

      // Validate position if provided
      if (
        updateData.position !== undefined &&
        (!Number.isInteger(updateData.position) || updateData.position < 0)
      ) {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: "Position must be a non-negative integer",
        });
      }

      const category = await this.categoryManagementService.updateCategory(
        id,
        updateData,
      );

      if (!category) {
        return reply.code(404).send({
          success: false,
          error: "Not Found",
          message: "Category not found",
        });
      }

      return reply.code(200).send({
        success: true,
        data: category.toData(),
        message: "Category updated successfully",
      });
    } catch (error) {
      request.log.error(error, "Failed to update category");

      if (error instanceof Error && error.message.includes("not found")) {
        return reply.code(404).send({
          success: false,
          error: "Not Found",
          message: "Category not found",
        });
      }

      if (
        error instanceof Error &&
        (error.message.includes("duplicate") ||
          error.message.includes("unique"))
      ) {
        return reply.code(409).send({
          success: false,
          error: "Conflict",
          message: "Category with this name or slug already exists",
        });
      }

      if (
        error instanceof Error &&
        (error.message.includes("parent") ||
          error.message.includes("circular") ||
          error.message.includes("hierarchy"))
      ) {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message:
            "Invalid category hierarchy - would create circular reference or parent not found",
        });
      }

      return reply.code(500).send({
        success: false,
        error: "Internal server error",
        message: "Failed to update category",
      });
    }
  }

  async deleteCategory(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const { id } = request.params;

      if (!id || typeof id !== "string") {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: "Category ID is required and must be a valid string",
        });
      }

      const deleted = await this.categoryManagementService.deleteCategory(id);

      if (!deleted) {
        return reply.code(404).send({
          success: false,
          error: "Not Found",
          message: "Category not found",
        });
      }

      return reply.code(200).send({
        success: true,
        message: "Category deleted successfully",
      });
    } catch (error) {
      request.log.error(error, "Failed to delete category");

      if (error instanceof Error && error.message.includes("not found")) {
        return reply.code(404).send({
          success: false,
          error: "Not Found",
          message: "Category not found",
        });
      }

      if (
        error instanceof Error &&
        (error.message.includes("children") ||
          error.message.includes("constraint"))
      ) {
        return reply.code(409).send({
          success: false,
          error: "Conflict",
          message:
            "Cannot delete category with existing subcategories or products",
        });
      }

      return reply.code(500).send({
        success: false,
        error: "Internal server error",
        message: "Failed to delete category",
      });
    }
  }

  async getCategoryHierarchy(request: FastifyRequest, reply: FastifyReply) {
    try {
      const hierarchy =
        await this.categoryManagementService.getCategoryHierarchy();

      return reply.code(200).send({
        success: true,
        data: hierarchy,
      });
    } catch (error) {
      request.log.error(error, "Failed to get category hierarchy");
      return reply.code(500).send({
        success: false,
        error: "Internal server error",
        message: "Failed to retrieve category hierarchy",
      });
    }
  }

  async reorderCategories(
    request: FastifyRequest<{
      Body: { categoryOrders: Array<{ id: string; position: number }> };
    }>,
    reply: FastifyReply,
  ) {
    try {
      const { categoryOrders } = request.body;

      if (!Array.isArray(categoryOrders)) {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: "categoryOrders must be an array",
        });
      }

      // Validate each order item
      for (const order of categoryOrders) {
        if (!order.id || typeof order.id !== "string") {
          return reply.code(400).send({
            success: false,
            error: "Bad Request",
            message: "Each category order must have a valid id",
          });
        }

        if (!Number.isInteger(order.position) || order.position < 0) {
          return reply.code(400).send({
            success: false,
            error: "Bad Request",
            message:
              "Each category order must have a valid position (non-negative integer)",
          });
        }
      }

      await this.categoryManagementService.reorderCategories(categoryOrders);

      return reply.code(200).send({
        success: true,
        message: "Categories reordered successfully",
      });
    } catch (error) {
      request.log.error(error, "Failed to reorder categories");

      if (error instanceof Error && error.message.includes("not found")) {
        return reply.code(404).send({
          success: false,
          error: "Not Found",
          message: "One or more categories not found",
        });
      }

      return reply.code(500).send({
        success: false,
        error: "Internal server error",
        message: "Failed to reorder categories",
      });
    }
  }
}
