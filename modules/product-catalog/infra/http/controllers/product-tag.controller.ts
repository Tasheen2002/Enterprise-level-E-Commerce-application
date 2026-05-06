import { FastifyReply } from "fastify";
import { AuthenticatedRequest } from "@/api/src/shared/interfaces/authenticated-request.interface";
import {
  CreateProductTagHandler,
  UpdateProductTagHandler,
  DeleteProductTagHandler,
  CreateBulkProductTagsHandler,
  DeleteBulkProductTagsHandler,
  AssociateProductTagsHandler,
  RemoveProductTagAssociationHandler,
  ListProductTagsHandler,
  GetProductTagHandler,
  GetProductTagSuggestionsHandler,
  GetProductTagStatsHandler,
  GetMostUsedProductTagsHandler,
  ValidateProductTagHandler,
  GetProductTagsHandler,
  GetTagProductsHandler,
} from "../../../application";
import { ResponseHelper } from "@/api/src/shared/response.helper";
import {
  TagParams,
  TagNameParams,
  TagByTagIdParams,
  ProductTagParams,
  ProductTagAssocParams,
  ListTagsQuery,
  TagSuggestionsQuery,
  MostUsedTagsQuery,
  TagProductsQuery,
  CreateTagBody,
  UpdateTagBody,
  BulkCreateTagsBody,
  BulkDeleteTagsBody,
  AssociateTagsBody,
} from "../validation/product-tag.schema";

export class ProductTagController {
  constructor(
    private readonly createProductTagHandler: CreateProductTagHandler,
    private readonly updateProductTagHandler: UpdateProductTagHandler,
    private readonly deleteProductTagHandler: DeleteProductTagHandler,
    private readonly createBulkProductTagsHandler: CreateBulkProductTagsHandler,
    private readonly deleteBulkProductTagsHandler: DeleteBulkProductTagsHandler,
    private readonly associateProductTagsHandler: AssociateProductTagsHandler,
    private readonly removeProductTagAssociationHandler: RemoveProductTagAssociationHandler,
    private readonly listProductTagsHandler: ListProductTagsHandler,
    private readonly getProductTagHandler: GetProductTagHandler,
    private readonly getProductTagSuggestionsHandler: GetProductTagSuggestionsHandler,
    private readonly getProductTagStatsHandler: GetProductTagStatsHandler,
    private readonly getMostUsedProductTagsHandler: GetMostUsedProductTagsHandler,
    private readonly validateProductTagHandler: ValidateProductTagHandler,
    private readonly getProductTagsHandler: GetProductTagsHandler,
    private readonly getTagProductsHandler: GetTagProductsHandler,
  ) {}

  // ── Reads ──────────────────────────────────────────────────────────────

  async getTags(
    request: AuthenticatedRequest<{ Querystring: ListTagsQuery }>,
    reply: FastifyReply,
  ) {
    try {
      const result = await this.listProductTagsHandler.handle(request.query);
      return ResponseHelper.ok(reply, "Tags retrieved successfully", result);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async getTag(
    request: AuthenticatedRequest<{ Params: TagParams }>,
    reply: FastifyReply,
  ) {
    try {
      const tag = await this.getProductTagHandler.handle({ id: request.params.id });
      return ResponseHelper.ok(reply, "Tag retrieved successfully", tag);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async getTagByName(
    request: AuthenticatedRequest<{ Params: TagNameParams }>,
    reply: FastifyReply,
  ) {
    try {
      const tag = await this.getProductTagHandler.handle({ name: request.params.name });
      return ResponseHelper.ok(reply, "Tag retrieved successfully", tag);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async getTagSuggestions(
    request: AuthenticatedRequest<{ Querystring: TagSuggestionsQuery }>,
    reply: FastifyReply,
  ) {
    try {
      const suggestions = await this.getProductTagSuggestionsHandler.handle(request.query);
      return ResponseHelper.ok(reply, "Tag suggestions retrieved successfully", suggestions);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async getTagStats(_request: AuthenticatedRequest, reply: FastifyReply) {
    try {
      const stats = await this.getProductTagStatsHandler.handle({});
      return ResponseHelper.ok(reply, "Tag statistics retrieved successfully", stats);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async getMostUsedTags(
    request: AuthenticatedRequest<{ Querystring: MostUsedTagsQuery }>,
    reply: FastifyReply,
  ) {
    try {
      const mostUsed = await this.getMostUsedProductTagsHandler.handle(request.query);
      return ResponseHelper.ok(reply, "Most used tags retrieved successfully", mostUsed);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async validateTag(
    request: AuthenticatedRequest<{ Params: TagNameParams }>,
    reply: FastifyReply,
  ) {
    try {
      const validation = await this.validateProductTagHandler.handle({ name: request.params.name });
      return ResponseHelper.ok(reply, "Tag validation completed", validation);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async getProductTags(
    request: AuthenticatedRequest<{ Params: ProductTagParams }>,
    reply: FastifyReply,
  ) {
    try {
      const tags = await this.getProductTagsHandler.handle({ productId: request.params.productId });
      return ResponseHelper.ok(reply, "Product tags retrieved successfully", tags);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async getTagProducts(
    request: AuthenticatedRequest<{ Params: TagByTagIdParams; Querystring: TagProductsQuery }>,
    reply: FastifyReply,
  ) {
    try {
      const result = await this.getTagProductsHandler.handle({
        tagId: request.params.tagId,
        page: request.query.page,
        limit: request.query.limit,
      });
      return ResponseHelper.ok(reply, "Tag products retrieved successfully", result);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  // ── Writes ─────────────────────────────────────────────────────────────

  async createTag(
    request: AuthenticatedRequest<{ Body: CreateTagBody }>,
    reply: FastifyReply,
  ) {
    try {
      const result = await this.createProductTagHandler.handle(request.body);
      return ResponseHelper.fromCommand(reply, result, "Tag created successfully", 201);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async createBulkTags(
    request: AuthenticatedRequest<{ Body: BulkCreateTagsBody }>,
    reply: FastifyReply,
  ) {
    try {
      const result = await this.createBulkProductTagsHandler.handle({ tags: request.body.tags });
      return ResponseHelper.fromCommand(reply, result, "Tags created successfully", 201);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async updateTag(
    request: AuthenticatedRequest<{ Params: TagParams; Body: UpdateTagBody }>,
    reply: FastifyReply,
  ) {
    try {
      const result = await this.updateProductTagHandler.handle({
        id: request.params.id,
        tag: request.body.tag,
        kind: request.body.kind,
      });
      return ResponseHelper.fromCommand(reply, result, "Tag updated successfully");
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async associateProductTags(
    request: AuthenticatedRequest<{ Params: ProductTagParams; Body: AssociateTagsBody }>,
    reply: FastifyReply,
  ) {
    try {
      const result = await this.associateProductTagsHandler.handle({
        productId: request.params.productId,
        tagIds: request.body.tagIds,
      });
      return ResponseHelper.fromCommand(reply, result, "Product tags associated successfully", undefined, 204);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async deleteTag(
    request: AuthenticatedRequest<{ Params: TagParams }>,
    reply: FastifyReply,
  ) {
    try {
      const result = await this.deleteProductTagHandler.handle({ id: request.params.id });
      return ResponseHelper.fromCommand(reply, result, "Tag deleted successfully", undefined, 204);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async deleteBulkTags(
    request: AuthenticatedRequest<{ Body: BulkDeleteTagsBody }>,
    reply: FastifyReply,
  ) {
    try {
      const result = await this.deleteBulkProductTagsHandler.handle({ ids: request.body.ids });
      return ResponseHelper.fromCommand(reply, result, "Tags deleted successfully", undefined, 204);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async removeProductTag(
    request: AuthenticatedRequest<{ Params: ProductTagAssocParams }>,
    reply: FastifyReply,
  ) {
    try {
      const result = await this.removeProductTagAssociationHandler.handle(request.params);
      return ResponseHelper.fromCommand(reply, result, "Product tag removed successfully", undefined, 204);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }
}
