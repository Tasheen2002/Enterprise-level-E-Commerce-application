import { FastifyRequest, FastifyReply } from "fastify";
import { ProductTagManagementService } from "../../../application/services/product-tag-management.service";
import { ProductTagQueryOptions } from "../../../domain/repositories/product-tag.repository";

interface CreateTagRequest {
  tag: string;
  kind?: string;
}

interface UpdateTagRequest extends Partial<CreateTagRequest> {}

interface TagQueryParams {
  page?: number;
  limit?: number;
  kind?: string;
  sortBy?: "tag" | "kind" | "usage_count";
  sortOrder?: "asc" | "desc";
}

interface BulkCreateTagsRequest {
  tags: CreateTagRequest[];
}

interface BulkDeleteTagsRequest {
  ids: string[];
}

export class ProductTagController {
  constructor(
    private readonly productTagManagementService: ProductTagManagementService,
  ) {}

  async getTags(
    request: FastifyRequest<{ Querystring: TagQueryParams }>,
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

      return reply.code(200).send({
        success: true,
        data: {
          tags: tags.tags || tags,
          pagination: {
            page: pageOptions.page,
            limit: pageOptions.limit,
            total: tags.total || 0,
            total_pages: Math.ceil((tags.total || 0) / pageOptions.limit),
          },
        },
      });
    } catch (error) {
      request.log.error(error, "Failed to get tags");
      return reply.code(500).send({
        success: false,
        error: "Internal server error",
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to retrieve tags",
      });
    }
  }

  async getTag(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const { id } = request.params;

      console.log("=== getTag called with id:", id);

      if (!id || typeof id !== "string") {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          code: "VALIDATION_ERROR",
          message: "Tag ID is required and must be a valid string",
        });
      }

      const tag = await this.productTagManagementService.getTagById(id);

      return reply.code(200).send({
        success: true,
        data: tag,
      });
    } catch (error) {
      request.log.error(error, "Failed to get tag");

      if (error instanceof Error && error.message.includes("not found")) {
        return reply.code(404).send({
          success: false,
          error: "Not Found",
          message: "Tag not found",
        });
      }

      return reply.code(500).send({
        success: false,
        error: "Internal server error",
        message: "Failed to retrieve tag",
      });
    }
  }

  async getTagByName(
    request: FastifyRequest<{ Params: { name: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const { name } = request.params;

      if (!name || typeof name !== "string") {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: "Tag name is required and must be a valid string",
        });
      }

      const tag = await this.productTagManagementService.getTagByName(
        decodeURIComponent(name),
      );

      return reply.code(200).send({
        success: true,
        data: tag,
      });
    } catch (error) {
      request.log.error(error, "Failed to get tag by name");

      if (error instanceof Error && error.message.includes("not found")) {
        return reply.code(404).send({
          success: false,
          error: "Not Found",
          message: "Tag not found",
        });
      }

      return reply.code(500).send({
        success: false,
        error: "Internal server error",
        message: "Failed to retrieve tag",
      });
    }
  }

  async createTag(
    request: FastifyRequest<{ Body: CreateTagRequest }>,
    reply: FastifyReply,
  ) {
    try {
      const tagData = request.body;

      // Basic validation
      if (
        !tagData.tag ||
        typeof tagData.tag !== "string" ||
        tagData.tag.trim().length === 0
      ) {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          code: "VALIDATION_ERROR",
          message: "Tag is required and must be a non-empty string",
        });
      }

      // Validate tag format
      if (tagData.tag.length > 50) {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          code: "VALIDATION_ERROR",
          message: "Tag cannot be longer than 50 characters",
        });
      }

      if (!/^[a-zA-Z0-9\s\-_]+$/.test(tagData.tag)) {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          code: "VALIDATION_ERROR",
          message:
            "Tag can only contain letters, numbers, spaces, hyphens, and underscores",
        });
      }

      const tag = await this.productTagManagementService.createTag(tagData);

      return reply.code(201).send({
        success: true,
        data: tag,
        message: "Tag created successfully",
      });
    } catch (error) {
      request.log.error(error, "Failed to create tag");

      if (error instanceof Error && error.message.includes("already exists")) {
        return reply.code(409).send({
          success: false,
          error: "Conflict",
          code: "TAG_ALREADY_EXISTS",
          message: "Tag with this name already exists",
        });
      }

      return reply.code(500).send({
        success: false,
        error: "Internal server error",
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to create tag",
      });
    }
  }

  async updateTag(
    request: FastifyRequest<{ Params: { id: string }; Body: UpdateTagRequest }>,
    reply: FastifyReply,
  ) {
    try {
      const { id } = request.params;
      const updateData = request.body;

      if (!id || typeof id !== "string") {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: "Tag ID is required and must be a valid string",
        });
      }

      // Validate tag if provided
      if (updateData.tag !== undefined) {
        if (
          typeof updateData.tag !== "string" ||
          updateData.tag.trim().length === 0
        ) {
          return reply.code(400).send({
            success: false,
            error: "Bad Request",
            message: "Tag must be a non-empty string",
          });
        }

        if (updateData.tag.length > 50) {
          return reply.code(400).send({
            success: false,
            error: "Bad Request",
            message: "Tag cannot be longer than 50 characters",
          });
        }

        if (!/^[a-zA-Z0-9\s\-_]+$/.test(updateData.tag)) {
          return reply.code(400).send({
            success: false,
            error: "Bad Request",
            message:
              "Tag can only contain letters, numbers, spaces, hyphens, and underscores",
          });
        }
      }

      const tag = await this.productTagManagementService.updateTag(
        id,
        updateData,
      );

      return reply.code(200).send({
        success: true,
        data: tag,
        message: "Tag updated successfully",
      });
    } catch (error) {
      request.log.error(error, "Failed to update tag");

      if (error instanceof Error && error.message.includes("not found")) {
        return reply.code(404).send({
          success: false,
          error: "Not Found",
          message: "Tag not found",
        });
      }

      if (error instanceof Error && error.message.includes("already exists")) {
        return reply.code(409).send({
          success: false,
          error: "Conflict",
          message: "Tag with this name already exists",
        });
      }

      return reply.code(500).send({
        success: false,
        error: "Internal server error",
        message: "Failed to update tag",
      });
    }
  }

  async deleteTag(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const { id } = request.params;

      if (!id || typeof id !== "string") {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: "Tag ID is required and must be a valid string",
        });
      }

      await this.productTagManagementService.deleteTag(id);

      console.log("Delete response being sent");

      return reply.code(200).send({
        success: true,
        message: "Tag deleted successfully",
      });
    } catch (error) {
      request.log.error(error, "Failed to delete tag");

      if (error instanceof Error && error.message.includes("not found")) {
        return reply.code(404).send({
          success: false,
          error: "Not Found",
          message: "Tag not found",
        });
      }

      if (
        error instanceof Error &&
        (error.message.includes("constraint") ||
          error.message.includes("foreign key"))
      ) {
        return reply.code(409).send({
          success: false,
          error: "Conflict",
          message: "Cannot delete tag with existing product associations",
        });
      }

      return reply.code(500).send({
        success: false,
        error: "Internal server error",
        message: "Failed to delete tag",
      });
    }
  }

  async getTagSuggestions(
    request: FastifyRequest<{ Querystring: { query: string; limit?: number } }>,
    reply: FastifyReply,
  ) {
    try {
      const { query, limit = 10 } = request.query;

      if (!query || typeof query !== "string" || query.trim().length === 0) {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: "Search query is required",
        });
      }

      const suggestions =
        await this.productTagManagementService.getTagSuggestions(
          query.trim(),
          Math.min(50, Math.max(1, limit)),
        );

      return reply.code(200).send({
        success: true,
        data: suggestions,
      });
    } catch (error) {
      request.log.error(error, "Failed to get tag suggestions");
      return reply.code(500).send({
        success: false,
        error: "Internal server error",
        message: "Failed to retrieve tag suggestions",
      });
    }
  }

  async getTagStats(request: FastifyRequest, reply: FastifyReply) {
    try {
      console.log("=== getTagStats called ===");
      const stats = await this.productTagManagementService.getTagStats();
      console.log("Stats to send:", JSON.stringify(stats, null, 2));

      const response = {
        success: true,
        data: stats,
      };

      console.log("Final response:", JSON.stringify(response, null, 2));

      return reply.code(200).send(response);
    } catch (error) {
      request.log.error(error, "Failed to get tag statistics");
      return reply.code(500).send({
        success: false,
        error: "Internal server error",
        message: "Failed to retrieve tag statistics",
      });
    }
  }

  async getMostUsedTags(
    request: FastifyRequest<{ Querystring: { limit?: number } }>,
    reply: FastifyReply,
  ) {
    try {
      const { limit = 10 } = request.query;

      const mostUsed = await this.productTagManagementService.getMostUsedTags(
        Math.min(50, Math.max(1, limit)),
      );

      return reply.code(200).send({
        success: true,
        data: mostUsed,
      });
    } catch (error) {
      request.log.error(error, "Failed to get most used tags");
      return reply.code(500).send({
        success: false,
        error: "Internal server error",
        message: "Failed to retrieve most used tags",
      });
    }
  }

  async createBulkTags(
    request: FastifyRequest<{ Body: BulkCreateTagsRequest }>,
    reply: FastifyReply,
  ) {
    try {
      const { tags } = request.body;

      if (!tags || !Array.isArray(tags) || tags.length === 0) {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: "Tags array is required and must not be empty",
        });
      }

      if (tags.length > 100) {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: "Cannot create more than 100 tags at once",
        });
      }

      // Validate each tag
      for (const tagData of tags) {
        if (
          !tagData.tag ||
          typeof tagData.tag !== "string" ||
          tagData.tag.trim().length === 0
        ) {
          return reply.code(400).send({
            success: false,
            error: "Bad Request",
            message: "All tags must have a non-empty tag name",
          });
        }
      }

      const createdTags =
        await this.productTagManagementService.createMultipleTags(tags);

      console.log("Created tags:", createdTags);
      console.log(
        "Serialized tags:",
        createdTags.map((tag) => tag.toData()),
      );

      return reply.code(201).send({
        success: true,
        data: createdTags.map((tag) => tag.toData()),
        message: `${createdTags.length} tags created successfully`,
      });
    } catch (error) {
      console.error("=== Bulk create error ===");
      console.error("Error:", error);
      console.error(
        "Error message:",
        error instanceof Error ? error.message : "Unknown error",
      );
      console.error(
        "Error stack:",
        error instanceof Error ? error.stack : "No stack",
      );

      request.log.error(error, "Failed to create bulk tags");
      return reply.code(500).send({
        success: false,
        error: "Internal server error",
        message: "Failed to create tags",
      });
    }
  }

  async deleteBulkTags(
    request: FastifyRequest<{ Body: BulkDeleteTagsRequest }>,
    reply: FastifyReply,
  ) {
    try {
      const { ids } = request.body;

      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: "Tag IDs array is required and must not be empty",
        });
      }

      if (ids.length > 100) {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: "Cannot delete more than 100 tags at once",
        });
      }

      const result =
        await this.productTagManagementService.deleteMultipleTags(ids);

      return reply.code(200).send({
        success: true,
        data: result,
        message: `${result.deleted.length} tags deleted successfully`,
      });
    } catch (error) {
      request.log.error(error, "Failed to delete bulk tags");
      return reply.code(500).send({
        success: false,
        error: "Internal server error",
        message: "Failed to delete tags",
      });
    }
  }

  async validateTag(
    request: FastifyRequest<{ Params: { name: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const { name } = request.params;

      if (!name || typeof name !== "string") {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: "Tag name is required and must be a valid string",
        });
      }

      const isValid = await this.productTagManagementService.validateTag(
        decodeURIComponent(name),
      );

      return reply.code(200).send({
        success: true,
        data: {
          tagName: name,
          isValid,
          available: isValid,
        },
      });
    } catch (error) {
      request.log.error(error, "Failed to validate tag");
      return reply.code(500).send({
        success: false,
        error: "Internal server error",
        message: "Failed to validate tag",
      });
    }
  }

  // Product Tag Association Methods
  async getProductTags(
    request: FastifyRequest<{ Params: { productId: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const { productId } = request.params;

      if (!productId || typeof productId !== "string") {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: "Product ID is required and must be a valid string",
        });
      }

      const tags =
        await this.productTagManagementService.getProductTags(productId);

      return reply.code(200).send({
        success: true,
        data: tags,
      });
    } catch (error) {
      request.log.error(error, "Failed to get product tags");

      if (error instanceof Error && error.message.includes("not found")) {
        return reply.code(404).send({
          success: false,
          error: "Not Found",
          message: "Product not found",
        });
      }

      return reply.code(500).send({
        success: false,
        error: "Internal server error",
        message: "Failed to retrieve product tags",
      });
    }
  }

  async associateProductTags(
    request: FastifyRequest<{
      Params: { productId: string };
      Body: { tagIds: string[] };
    }>,
    reply: FastifyReply,
  ) {
    try {
      const { productId } = request.params;
      const { tagIds } = request.body;

      if (!productId || typeof productId !== "string") {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: "Product ID is required and must be a valid string",
        });
      }

      if (!tagIds || !Array.isArray(tagIds) || tagIds.length === 0) {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: "Tag IDs are required and must be a non-empty array",
        });
      }

      await this.productTagManagementService.associateProductTags(
        productId,
        tagIds,
      );

      return reply.code(200).send({
        success: true,
        message: "Tags associated successfully",
      });
    } catch (error) {
      request.log.error(error, "Failed to associate product tags");

      if (error instanceof Error && error.message.includes("not found")) {
        return reply.code(404).send({
          success: false,
          error: "Not Found",
          message: error.message,
        });
      }

      return reply.code(500).send({
        success: false,
        error: "Internal server error",
        message: "Failed to associate tags",
      });
    }
  }

  async removeProductTag(
    request: FastifyRequest<{
      Params: { productId: string; tagId: string };
    }>,
    reply: FastifyReply,
  ) {
    try {
      const { productId, tagId } = request.params;

      if (!productId || typeof productId !== "string") {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: "Product ID is required and must be a valid string",
        });
      }

      if (!tagId || typeof tagId !== "string") {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: "Tag ID is required and must be a valid string",
        });
      }

      await this.productTagManagementService.removeProductTag(productId, tagId);

      return reply.code(200).send({
        success: true,
        message: "Tag removed successfully",
      });
    } catch (error) {
      request.log.error(error, "Failed to remove product tag");

      if (error instanceof Error && error.message.includes("not found")) {
        return reply.code(404).send({
          success: false,
          error: "Not Found",
          message: error.message,
        });
      }

      return reply.code(500).send({
        success: false,
        error: "Internal server error",
        message: "Failed to remove tag",
      });
    }
  }

  async getTagProducts(
    request: FastifyRequest<{
      Params: { tagId: string };
      Querystring: { page?: number; limit?: number };
    }>,
    reply: FastifyReply,
  ) {
    try {
      const { tagId } = request.params;
      const { page = 1, limit = 20 } = request.query;

      if (!tagId || typeof tagId !== "string") {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: "Tag ID is required and must be a valid string",
        });
      }

      const serviceOptions = {
        limit: Math.min(100, Math.max(1, limit)),
        offset: (Math.max(1, page) - 1) * Math.min(100, Math.max(1, limit)),
      };

      const result = await this.productTagManagementService.getTagProducts(
        tagId,
        serviceOptions,
      );

      return reply.code(200).send({
        success: true,
        data: {
          products: result.products || result,
          pagination: {
            page: Math.max(1, page),
            limit: Math.min(100, Math.max(1, limit)),
            total: result.total || 0,
            total_pages: Math.ceil(
              (result.total || 0) / Math.min(100, Math.max(1, limit)),
            ),
          },
        },
      });
    } catch (error) {
      request.log.error(error, "Failed to get tag products");

      if (error instanceof Error && error.message.includes("not found")) {
        return reply.code(404).send({
          success: false,
          error: "Not Found",
          message: "Tag not found",
        });
      }

      return reply.code(500).send({
        success: false,
        error: "Internal server error",
        message: "Failed to retrieve tag products",
      });
    }
  }
}
