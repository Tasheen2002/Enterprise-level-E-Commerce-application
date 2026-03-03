import { FastifyRequest, FastifyReply } from "fastify";
import { CategoryManagementService } from "../../../application/services/category-management.service";
import { ResponseHelper } from "@/api/src/shared/response.helper";

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

      const categories = await this.categoryManagementService.getCategories(options);
      const mappedData = categories.map((category) => category.toData());

      return ResponseHelper.ok(reply, "Categories retrieved successfully", {
        categories: mappedData,
        meta: {
          page: options.page,
          limit: options.limit,
          parentId: options.parentId || null,
          includeChildren: options.includeChildren,
          sortBy: options.sortBy,
          sortOrder: options.sortOrder,
        },
      });
    } catch (error) {
      request.log.error(error, "Failed to get categories");
      return ResponseHelper.error(reply, error);
    }
  }

  async getCategory(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const { id } = request.params;

      const category = await this.categoryManagementService.getCategoryById(id);

      if (!category) {
        return ResponseHelper.notFound(reply, "Category not found");
      }

      return ResponseHelper.ok(reply, "Category retrieved successfully", category.toData());
    } catch (error) {
      request.log.error(error, "Failed to get category");
      return ResponseHelper.error(reply, error);
    }
  }

  async getCategoryBySlug(
    request: FastifyRequest<{ Params: { slug: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const { slug } = request.params;

      const category = await this.categoryManagementService.getCategoryBySlug(slug);

      if (!category) {
        return ResponseHelper.notFound(reply, "Category not found");
      }

      return ResponseHelper.ok(reply, "Category retrieved successfully", category.toData());
    } catch (error) {
      request.log.error(error, "Failed to get category by slug");
      return ResponseHelper.error(reply, error);
    }
  }

  async createCategory(
    request: FastifyRequest<{ Body: CreateCategoryRequest }>,
    reply: FastifyReply,
  ) {
    try {
      const categoryData = request.body;

      const category = await this.categoryManagementService.createCategory(categoryData);

      return ResponseHelper.created(reply, "Category created successfully", category.toData());
    } catch (error) {
      request.log.error(error, "Failed to create category");

      if (error instanceof Error) {
        if (error.message.includes("duplicate") || error.message.includes("unique")) {
          return reply.status(409).send({
            success: false,
            statusCode: 409,
            error: "Conflict",
            message: "Category with this name or slug already exists",
          });
        }

        if (error.message.includes("parent") || error.message.includes("not found")) {
          return ResponseHelper.badRequest(reply, "Parent category not found");
        }

        if (error.message.includes("circular") || error.message.includes("hierarchy")) {
          return ResponseHelper.badRequest(reply, "Invalid category hierarchy - would create circular reference");
        }

        if (error.message.includes("UUID") || error.message.includes("uuid")) {
          return ResponseHelper.badRequest(reply, "Invalid parent ID format - must be a valid UUID");
        }
      }

      return ResponseHelper.error(reply, error);
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

      const category = await this.categoryManagementService.updateCategory(id, updateData);

      if (!category) {
        return ResponseHelper.notFound(reply, "Category not found");
      }

      return ResponseHelper.ok(reply, "Category updated successfully", category.toData());
    } catch (error) {
      request.log.error(error, "Failed to update category");

      if (error instanceof Error && error.message.includes("not found")) {
        return ResponseHelper.notFound(reply, "Category not found");
      }

      if (
        error instanceof Error &&
        (error.message.includes("duplicate") || error.message.includes("unique"))
      ) {
        return reply.status(409).send({
          success: false,
          statusCode: 409,
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
        return ResponseHelper.badRequest(reply, "Invalid category hierarchy - would create circular reference or parent not found");
      }

      return ResponseHelper.error(reply, error);
    }
  }

  async deleteCategory(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const { id } = request.params;

      const deleted = await this.categoryManagementService.deleteCategory(id);

      if (!deleted) {
        return ResponseHelper.notFound(reply, "Category not found");
      }

      return ResponseHelper.ok(reply, "Category deleted successfully");
    } catch (error) {
      request.log.error(error, "Failed to delete category");

      if (error instanceof Error && error.message.includes("not found")) {
        return ResponseHelper.notFound(reply, "Category not found");
      }

      if (
        error instanceof Error &&
        (error.message.includes("children") || error.message.includes("constraint"))
      ) {
        return reply.status(409).send({
          success: false,
          statusCode: 409,
          error: "Conflict",
          message: "Cannot delete category with existing subcategories or products",
        });
      }

      return ResponseHelper.error(reply, error);
    }
  }

  async getCategoryHierarchy(request: FastifyRequest, reply: FastifyReply) {
    try {
      const hierarchy = await this.categoryManagementService.getCategoryHierarchy();
      return ResponseHelper.ok(reply, "Category hierarchy retrieved successfully", hierarchy);
    } catch (error) {
      request.log.error(error, "Failed to get category hierarchy");
      return ResponseHelper.error(reply, error);
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

      await this.categoryManagementService.reorderCategories(categoryOrders);

      return ResponseHelper.ok(reply, "Categories reordered successfully");
    } catch (error) {
      request.log.error(error, "Failed to reorder categories");

      if (error instanceof Error && error.message.includes("not found")) {
        return ResponseHelper.notFound(reply, "One or more categories not found");
      }

      return ResponseHelper.error(reply, error);
    }
  }
}
