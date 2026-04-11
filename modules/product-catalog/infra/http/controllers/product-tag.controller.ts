import { FastifyReply } from "fastify";
import { AuthenticatedRequest } from "@/api/src/shared/interfaces/authenticated-request.interface";
import { ProductTagManagementService } from "../../../application/services/product-tag-management.service";
import { ProductTagQueryOptions } from "../../../domain/repositories/product-tag.repository";
import { ResponseHelper } from "@/api/src/shared/response.helper";

export interface CreateTagRequest {
  tag: string;
  kind?: string;
}

export interface UpdateTagRequest extends Partial<CreateTagRequest> {}

interface TagQueryParams {
  page?: number;
  limit?: number;
  kind?: string;
  sortBy?: "tag" | "kind";
  sortOrder?: "asc" | "desc";
}

export interface BulkCreateTagsRequest {
  tags: CreateTagRequest[];
}

export interface BulkDeleteTagsRequest {
  ids: string[];
}

export class ProductTagController {
  constructor(
    private readonly productTagManagementService: ProductTagManagementService,
  ) {}

  async getTags(
    request: AuthenticatedRequest<{ Querystring: TagQueryParams }>,
    reply: FastifyReply,
  ) {
    try {
      const {
        page = 1,
        limit = 20,
        kind,
        sortBy = "tag",
        sortOrder = "asc",
      } = request.query;

      const serviceOptions: ProductTagQueryOptions = {
        limit: Math.min(100, Math.max(1, limit)),
        offset: (Math.max(1, page) - 1) * Math.min(100, Math.max(1, limit)),
        sortBy,
        sortOrder,
      };

      const pageOptions = {
        page: Math.max(1, page),
        limit: Math.min(100, Math.max(1, limit)),
        sortBy,
        sortOrder,
      };

      let tags;
      if (kind) {
        tags = await this.productTagManagementService.getTagsByKind(
          kind,
          serviceOptions,
        );
      } else {
        tags =
          await this.productTagManagementService.getAllTags(serviceOptions);
      }

      return ResponseHelper.ok(reply, "Tags retrieved successfully", {
        tags: tags.tags || tags,
        pagination: {
          page: pageOptions.page,
          limit: pageOptions.limit,
          total: tags.total || 0,
          total_pages: Math.ceil((tags.total || 0) / pageOptions.limit),
        },
      });
    } catch (error) {
      return ResponseHelper.error(reply, error);
    }
  }

  async getTag(
    request: AuthenticatedRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const { id } = request.params;

      const tag = await this.productTagManagementService.getTagById(id);

      return ResponseHelper.ok(reply, "Tag retrieved successfully", tag);
    } catch (error) {
      return ResponseHelper.error(reply, error);
    }
  }

  async getTagByName(
    request: AuthenticatedRequest<{ Params: { name: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const { name } = request.params;

      const tag = await this.productTagManagementService.getTagByName(
        decodeURIComponent(name),
      );

      return ResponseHelper.ok(reply, "Tag retrieved successfully", tag);
    } catch (error) {
      return ResponseHelper.error(reply, error);
    }
  }

  async createTag(
    request: AuthenticatedRequest<{ Body: CreateTagRequest }>,
    reply: FastifyReply,
  ) {
    try {
      const tagData = request.body;

      const tag = await this.productTagManagementService.createTag(tagData);

      return ResponseHelper.created(reply, "Tag created successfully", tag);
    } catch (error) {
      if (error instanceof Error && error.message.includes("already exists")) {
        return reply.status(409).send({
          success: false,
          statusCode: 409,
          error: "Conflict",
          message: "Tag with this name already exists",
        });
      }

      return ResponseHelper.error(reply, error);
    }
  }

  async updateTag(
    request: AuthenticatedRequest<{ Params: { id: string }; Body: UpdateTagRequest }>,
    reply: FastifyReply,
  ) {
    try {
      const { id } = request.params;
      const updateData = request.body;

      const tag = await this.productTagManagementService.updateTag(
        id,
        updateData,
      );

      return ResponseHelper.ok(reply, "Tag updated successfully", tag);
    } catch (error) {
      if (error instanceof Error && error.message.includes("already exists")) {
        return reply.status(409).send({
          success: false,
          statusCode: 409,
          error: "Conflict",
          message: "Tag with this name already exists",
        });
      }

      return ResponseHelper.error(reply, error);
    }
  }

  async deleteTag(
    request: AuthenticatedRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const { id } = request.params;

      await this.productTagManagementService.deleteTag(id);

      return ResponseHelper.noContent(reply);
    } catch (error) {
      if (
        error instanceof Error &&
        (error.message.includes("constraint") ||
          error.message.includes("foreign key"))
      ) {
        return reply.status(409).send({
          success: false,
          statusCode: 409,
          error: "Conflict",
          message: "Cannot delete tag with existing product associations",
        });
      }

      return ResponseHelper.error(reply, error);
    }
  }

  async getTagSuggestions(
    request: AuthenticatedRequest<{ Querystring: { query: string; limit?: number } }>,
    reply: FastifyReply,
  ) {
    try {
      const { query, limit = 10 } = request.query;

      const suggestions =
        await this.productTagManagementService.getTagSuggestions(
          query.trim(),
          Math.min(50, Math.max(1, limit)),
        );

      return ResponseHelper.ok(reply, "Tag suggestions retrieved successfully", suggestions);
    } catch (error) {
      return ResponseHelper.error(reply, error);
    }
  }

  async getTagStats(_request: AuthenticatedRequest, reply: FastifyReply) {
    try {
      const stats = await this.productTagManagementService.getTagStats();
      return ResponseHelper.ok(reply, "Tag statistics retrieved successfully", stats);
    } catch (error) {
      return ResponseHelper.error(reply, error);
    }
  }

  async getMostUsedTags(
    request: AuthenticatedRequest<{ Querystring: { limit?: number } }>,
    reply: FastifyReply,
  ) {
    try {
      const { limit = 10 } = request.query;

      const mostUsed = await this.productTagManagementService.getMostUsedTags(
        Math.min(50, Math.max(1, limit)),
      );

      return ResponseHelper.ok(reply, "Most used tags retrieved successfully", mostUsed);
    } catch (error) {
      return ResponseHelper.error(reply, error);
    }
  }

  async createBulkTags(
    request: AuthenticatedRequest<{ Body: BulkCreateTagsRequest }>,
    reply: FastifyReply,
  ) {
    try {
      const { tags } = request.body;

      const createdTags =
        await this.productTagManagementService.createMultipleTags(tags);

      return ResponseHelper.created(
        reply,
        `${createdTags.length} tags created successfully`,
        createdTags,
      );
    } catch (error) {
      return ResponseHelper.error(reply, error);
    }
  }

  async deleteBulkTags(
    request: AuthenticatedRequest<{ Body: BulkDeleteTagsRequest }>,
    reply: FastifyReply,
  ) {
    try {
      const { ids } = request.body;

      await this.productTagManagementService.deleteMultipleTags(ids);

      return ResponseHelper.noContent(reply);
    } catch (error) {
      return ResponseHelper.error(reply, error);
    }
  }

  async validateTag(
    request: AuthenticatedRequest<{ Params: { name: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const { name } = request.params;

      const isValid = await this.productTagManagementService.validateTag(
        decodeURIComponent(name),
      );

      return ResponseHelper.ok(reply, "Tag validation completed", {
        tagName: name,
        isValid,
        available: isValid,
      });
    } catch (error) {
      return ResponseHelper.error(reply, error);
    }
  }

  // Product Tag Association Methods
  async getProductTags(
    request: AuthenticatedRequest<{ Params: { productId: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const { productId } = request.params;

      const tags =
        await this.productTagManagementService.getProductTags(productId);

      return ResponseHelper.ok(reply, "Product tags retrieved successfully", tags);
    } catch (error) {
      return ResponseHelper.error(reply, error);
    }
  }

  async associateProductTags(
    request: AuthenticatedRequest<{
      Params: { productId: string };
      Body: { tagIds: string[] };
    }>,
    reply: FastifyReply,
  ) {
    try {
      const { productId } = request.params;
      const { tagIds } = request.body;

      await this.productTagManagementService.associateProductTags(
        productId,
        tagIds,
      );

      return ResponseHelper.noContent(reply);
    } catch (error) {
      return ResponseHelper.error(reply, error);
    }
  }

  async removeProductTag(
    request: AuthenticatedRequest<{
      Params: { productId: string; tagId: string };
    }>,
    reply: FastifyReply,
  ) {
    try {
      const { productId, tagId } = request.params;

      await this.productTagManagementService.removeProductTag(productId, tagId);

      return ResponseHelper.noContent(reply);
    } catch (error) {
      return ResponseHelper.error(reply, error);
    }
  }

  async getTagProducts(
    request: AuthenticatedRequest<{
      Params: { tagId: string };
      Querystring: { page?: number; limit?: number };
    }>,
    reply: FastifyReply,
  ) {
    try {
      const { tagId } = request.params;
      const { page = 1, limit = 20 } = request.query;

      const serviceOptions = {
        limit: Math.min(100, Math.max(1, limit)),
        offset: (Math.max(1, page) - 1) * Math.min(100, Math.max(1, limit)),
      };

      const result = await this.productTagManagementService.getTagProducts(
        tagId,
        serviceOptions,
      );

      return ResponseHelper.ok(reply, "Tag products retrieved successfully", {
        products: result.products || result,
        pagination: {
          page: Math.max(1, page),
          limit: Math.min(100, Math.max(1, limit)),
          total: result.total || 0,
          total_pages: Math.ceil(
            (result.total || 0) / Math.min(100, Math.max(1, limit)),
          ),
        },
      });
    } catch (error) {
      return ResponseHelper.error(reply, error);
    }
  }
}
