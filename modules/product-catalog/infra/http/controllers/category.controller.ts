import { FastifyReply } from "fastify";
import { AuthenticatedRequest } from "@/api/src/shared/interfaces/authenticated-request.interface";
import {
  CreateCategoryHandler,
  UpdateCategoryHandler,
  DeleteCategoryHandler,
  ReorderCategoriesHandler,
  GetCategoryHandler,
  ListCategoriesHandler,
  GetCategoryHierarchyHandler,
} from "../../../application";
import { ResponseHelper } from "@/api/src/shared/response.helper";

export class CategoryController {
  constructor(
    private readonly createCategoryHandler: CreateCategoryHandler,
    private readonly updateCategoryHandler: UpdateCategoryHandler,
    private readonly deleteCategoryHandler: DeleteCategoryHandler,
    private readonly reorderCategoriesHandler: ReorderCategoriesHandler,
    private readonly getCategoryHandler: GetCategoryHandler,
    private readonly listCategoriesHandler: ListCategoriesHandler,
    private readonly getCategoryHierarchyHandler: GetCategoryHierarchyHandler,
  ) {}

  async getCategories(
    request: AuthenticatedRequest<{
      Querystring: {
        page?: number;
        limit?: number;
        parentId?: string;
        includeChildren?: boolean;
        sortBy?: "name" | "position";
        sortOrder?: "asc" | "desc";
      };
    }>,
    reply: FastifyReply,
  ) {
    try {
      const result = await this.listCategoriesHandler.handle(request.query);
      return ResponseHelper.ok(reply, "Categories retrieved successfully", result);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async getCategory(
    request: AuthenticatedRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const result = await this.getCategoryHandler.handle({
        categoryId: request.params.id,
      });
      return ResponseHelper.ok(
        reply,
        "Category retrieved successfully",
        result,
      );
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async getCategoryBySlug(
    request: AuthenticatedRequest<{ Params: { slug: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const result = await this.getCategoryHandler.handle({
        slug: request.params.slug,
      });
      return ResponseHelper.ok(
        reply,
        "Category retrieved successfully",
        result,
      );
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async createCategory(
    request: AuthenticatedRequest<{
      Body: { name: string; parentId?: string; position?: number };
    }>,
    reply: FastifyReply,
  ) {
    try {
      const result = await this.createCategoryHandler.handle(request.body);
      return ResponseHelper.fromCommand(
        reply,
        result,
        "Category created successfully",
        201,
      );
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async updateCategory(
    request: AuthenticatedRequest<{
      Params: { id: string };
      Body: { name?: string; parentId?: string; position?: number };
    }>,
    reply: FastifyReply,
  ) {
    try {
      const { id } = request.params;
      const result = await this.updateCategoryHandler.handle({
        categoryId: id,
        ...request.body,
      });
      return ResponseHelper.fromCommand(
        reply,
        result,
        "Category updated successfully",
      );
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async deleteCategory(
    request: AuthenticatedRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const result = await this.deleteCategoryHandler.handle({
        categoryId: request.params.id,
      });
      return ResponseHelper.fromCommand(
        reply,
        result,
        "Category deleted successfully",
        undefined,
        204,
      );
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async getCategoryHierarchy(
    _request: AuthenticatedRequest,
    reply: FastifyReply,
  ) {
    try {
      const result = await this.getCategoryHierarchyHandler.handle({});
      return ResponseHelper.ok(
        reply,
        "Category hierarchy retrieved successfully",
        result,
      );
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async reorderCategories(
    request: AuthenticatedRequest<{
      Body: { categoryOrders: Array<{ id: string; position: number }> };
    }>,
    reply: FastifyReply,
  ) {
    try {
      const result = await this.reorderCategoriesHandler.handle(request.body);
      return ResponseHelper.fromCommand(
        reply,
        result,
        "Categories reordered successfully",
        undefined,
        204,
      );
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }
}
