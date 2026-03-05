import { FastifyRequest, FastifyReply } from "fastify";
import {
  CreateCategoryCommand,
  CreateCategoryHandler,
  UpdateCategoryCommand,
  UpdateCategoryHandler,
  DeleteCategoryCommand,
  DeleteCategoryHandler,
  ReorderCategoriesCommand,
  ReorderCategoriesHandler,
  GetCategoryQuery,
  GetCategoryHandler,
  ListCategoriesQuery,
  ListCategoriesHandler,
  GetCategoryHierarchyQuery,
  GetCategoryHierarchyHandler,
} from "../../../application";
import { CategoryManagementService } from "../../../application/services/category-management.service";
import { ResponseHelper } from "@/api/src/shared/response.helper";

export interface CreateCategoryRequest {
  name: string;
  parentId?: string;
  position?: number;
}

export interface UpdateCategoryRequest extends Partial<CreateCategoryRequest> {}

export interface CategoryQueryParams {
  page?: number;
  limit?: number;
  parentId?: string;
  includeChildren?: boolean;
  sortBy?: "name" | "position" | "createdAt";
  sortOrder?: "asc" | "desc";
}

export class CategoryController {
  private createCategoryHandler: CreateCategoryHandler;
  private updateCategoryHandler: UpdateCategoryHandler;
  private deleteCategoryHandler: DeleteCategoryHandler;
  private reorderCategoriesHandler: ReorderCategoriesHandler;
  private getCategoryHandler: GetCategoryHandler;
  private listCategoriesHandler: ListCategoriesHandler;
  private getCategoryHierarchyHandler: GetCategoryHierarchyHandler;

  constructor(categoryManagementService: CategoryManagementService) {
    this.createCategoryHandler = new CreateCategoryHandler(
      categoryManagementService,
    );
    this.updateCategoryHandler = new UpdateCategoryHandler(
      categoryManagementService,
    );
    this.deleteCategoryHandler = new DeleteCategoryHandler(
      categoryManagementService,
    );
    this.reorderCategoriesHandler = new ReorderCategoriesHandler(
      categoryManagementService,
    );
    this.getCategoryHandler = new GetCategoryHandler(categoryManagementService);
    this.listCategoriesHandler = new ListCategoriesHandler(
      categoryManagementService,
    );
    this.getCategoryHierarchyHandler = new GetCategoryHierarchyHandler(
      categoryManagementService,
    );
  }

  async getCategories(
    request: FastifyRequest<{ Querystring: CategoryQueryParams }>,
    reply: FastifyReply,
  ) {
    try {
      const query: ListCategoriesQuery = {
        page: request.query.page,
        limit: request.query.limit,
        parentId: request.query.parentId,
        includeChildren: request.query.includeChildren,
        sortBy: request.query.sortBy,
        sortOrder: request.query.sortOrder,
      };

      const result = await this.listCategoriesHandler.handle(query);
      return ResponseHelper.fromQuery(
        reply,
        result,
        "Categories retrieved successfully",
      );
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
      const query: GetCategoryQuery = { categoryId: request.params.id };
      const result = await this.getCategoryHandler.handle(query);
      return ResponseHelper.fromQuery(
        reply,
        result,
        "Category retrieved successfully",
        "Category not found",
      );
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
      const query: GetCategoryQuery = { slug: request.params.slug };
      const result = await this.getCategoryHandler.handle(query);
      return ResponseHelper.fromQuery(
        reply,
        result,
        "Category retrieved successfully",
        "Category not found",
      );
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
      const body = request.body;
      const command: CreateCategoryCommand = {
        name: body.name,
        parentId: body.parentId,
        position: body.position,
      };

      const result = await this.createCategoryHandler.handle(command);

      if (result.success && result.data) {
        return ResponseHelper.created(
          reply,
          "Category created successfully",
          result.data.toData(),
        );
      }
      return ResponseHelper.badRequest(
        reply,
        result.error || "Category creation failed",
      );
    } catch (error) {
      request.log.error(error, "Failed to create category");
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
      const body = request.body;
      const command: UpdateCategoryCommand = {
        categoryId: id,
        name: body.name,
        parentId: body.parentId,
        position: body.position,
      };

      const result = await this.updateCategoryHandler.handle(command);

      if (result.success && result.data) {
        return ResponseHelper.ok(
          reply,
          "Category updated successfully",
          result.data.toData(),
        );
      }
      return ResponseHelper.fromCommand(
        reply,
        result,
        "Category updated successfully",
      );
    } catch (error) {
      request.log.error(error, "Failed to update category");
      return ResponseHelper.error(reply, error);
    }
  }

  async deleteCategory(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const command: DeleteCategoryCommand = { categoryId: request.params.id };
      const result = await this.deleteCategoryHandler.handle(command);
      return ResponseHelper.fromCommand(
        reply,
        result,
        "Category deleted successfully",
      );
    } catch (error) {
      request.log.error(error, "Failed to delete category");
      return ResponseHelper.error(reply, error);
    }
  }

  async getCategoryHierarchy(request: FastifyRequest, reply: FastifyReply) {
    try {
      const query: GetCategoryHierarchyQuery = {};
      const result = await this.getCategoryHierarchyHandler.handle(query);
      return ResponseHelper.fromQuery(
        reply,
        result,
        "Category hierarchy retrieved successfully",
      );
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
      const command: ReorderCategoriesCommand = {
        categoryOrders: request.body.categoryOrders,
      };
      const result = await this.reorderCategoriesHandler.handle(command);
      return ResponseHelper.fromCommand(
        reply,
        result,
        "Categories reordered successfully",
      );
    } catch (error) {
      request.log.error(error, "Failed to reorder categories");
      return ResponseHelper.error(reply, error);
    }
  }
}
