import { FastifyReply } from "fastify";
import { AuthenticatedRequest } from "@/api/src/shared/interfaces/authenticated-request.interface";
import {
  CreateEditorialLookHandler,
  UpdateEditorialLookHandler,
  DeleteEditorialLookHandler,
  PublishEditorialLookHandler,
  UnpublishEditorialLookHandler,
  ScheduleEditorialLookPublicationHandler,
  ProcessScheduledEditorialLookPublicationsHandler,
  SetEditorialLookHeroImageHandler,
  RemoveEditorialLookHeroImageHandler,
  AddProductToEditorialLookHandler,
  RemoveProductFromEditorialLookHandler,
  SetEditorialLookProductsHandler,
  UpdateEditorialLookStoryContentHandler,
  ClearEditorialLookStoryContentHandler,
  CreateBulkEditorialLooksHandler,
  DeleteBulkEditorialLooksHandler,
  PublishBulkEditorialLooksHandler,
  DuplicateEditorialLookHandler,
  ListEditorialLooksHandler,
  GetEditorialLookHandler,
  GetReadyToPublishEditorialLooksHandler,
  GetEditorialLooksByHeroAssetHandler,
  GetEditorialLookProductsHandler,
  GetProductEditorialLooksHandler,
  GetEditorialLooksByProductHandler,
  GetEditorialLookStatsHandler,
  GetPopularEditorialLookProductsHandler,
  ValidateEditorialLookForPublicationHandler,
} from "../../../application";
import { ResponseHelper } from "@/api/src/shared/response.helper";
import {
  EditorialLookParams,
  EditorialLookProductParams,
  ProductLooksParams,
  HeroAssetParams,
  ListEditorialLooksQuery,
  PopularProductsQuery,
  CreateEditorialLookBody,
  UpdateEditorialLookBody,
  SchedulePublicationBody,
  SetHeroImageBody,
  UpdateStoryContentBody,
  SetLookProductsBody,
  DuplicateEditorialLookBody,
  BulkCreateEditorialLooksBody,
  BulkPublishEditorialLooksBody,
  BulkDeleteEditorialLooksBody,
} from "../validation/editorial-look.schema";

export class EditorialLookController {
  constructor(
    private readonly createEditorialLookHandler: CreateEditorialLookHandler,
    private readonly updateEditorialLookHandler: UpdateEditorialLookHandler,
    private readonly deleteEditorialLookHandler: DeleteEditorialLookHandler,
    private readonly publishEditorialLookHandler: PublishEditorialLookHandler,
    private readonly unpublishEditorialLookHandler: UnpublishEditorialLookHandler,
    private readonly scheduleEditorialLookPublicationHandler: ScheduleEditorialLookPublicationHandler,
    private readonly processScheduledEditorialLookPublicationsHandler: ProcessScheduledEditorialLookPublicationsHandler,
    private readonly setEditorialLookHeroImageHandler: SetEditorialLookHeroImageHandler,
    private readonly removeEditorialLookHeroImageHandler: RemoveEditorialLookHeroImageHandler,
    private readonly addProductToEditorialLookHandler: AddProductToEditorialLookHandler,
    private readonly removeProductFromEditorialLookHandler: RemoveProductFromEditorialLookHandler,
    private readonly setEditorialLookProductsHandler: SetEditorialLookProductsHandler,
    private readonly updateEditorialLookStoryContentHandler: UpdateEditorialLookStoryContentHandler,
    private readonly clearEditorialLookStoryContentHandler: ClearEditorialLookStoryContentHandler,
    private readonly createBulkEditorialLooksHandler: CreateBulkEditorialLooksHandler,
    private readonly deleteBulkEditorialLooksHandler: DeleteBulkEditorialLooksHandler,
    private readonly publishBulkEditorialLooksHandler: PublishBulkEditorialLooksHandler,
    private readonly duplicateEditorialLookHandler: DuplicateEditorialLookHandler,
    private readonly listEditorialLooksHandler: ListEditorialLooksHandler,
    private readonly getEditorialLookHandler: GetEditorialLookHandler,
    private readonly getReadyToPublishEditorialLooksHandler: GetReadyToPublishEditorialLooksHandler,
    private readonly getEditorialLooksByHeroAssetHandler: GetEditorialLooksByHeroAssetHandler,
    private readonly getEditorialLookProductsHandler: GetEditorialLookProductsHandler,
    private readonly getProductEditorialLooksHandler: GetProductEditorialLooksHandler,
    private readonly getEditorialLooksByProductHandler: GetEditorialLooksByProductHandler,
    private readonly getEditorialLookStatsHandler: GetEditorialLookStatsHandler,
    private readonly getPopularEditorialLookProductsHandler: GetPopularEditorialLookProductsHandler,
    private readonly validateEditorialLookForPublicationHandler: ValidateEditorialLookForPublicationHandler,
  ) {}

  // ── Reads ──────────────────────────────────────────────────────────────

  async getEditorialLooks(
    request: AuthenticatedRequest<{ Querystring: ListEditorialLooksQuery }>,
    reply: FastifyReply,
  ) {
    try {
      const result = await this.listEditorialLooksHandler.handle(request.query);
      return ResponseHelper.ok(reply, "Editorial looks retrieved successfully", result);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async getEditorialLook(
    request: AuthenticatedRequest<{ Params: EditorialLookParams }>,
    reply: FastifyReply,
  ) {
    try {
      const look = await this.getEditorialLookHandler.handle({ id: request.params.id });
      return ResponseHelper.ok(reply, "Editorial look retrieved successfully", look);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async getReadyToPublishLooks(_request: AuthenticatedRequest, reply: FastifyReply) {
    try {
      const looks = await this.getReadyToPublishEditorialLooksHandler.handle({});
      return ResponseHelper.ok(reply, "Ready to publish looks retrieved successfully", looks);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async getLooksByHeroAsset(
    request: AuthenticatedRequest<{ Params: HeroAssetParams }>,
    reply: FastifyReply,
  ) {
    try {
      const looks = await this.getEditorialLooksByHeroAssetHandler.handle({ assetId: request.params.assetId });
      return ResponseHelper.ok(reply, "Looks by hero asset retrieved successfully", looks);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async getLookProducts(
    request: AuthenticatedRequest<{ Params: EditorialLookParams }>,
    reply: FastifyReply,
  ) {
    try {
      const productIds = await this.getEditorialLookProductsHandler.handle({ id: request.params.id });
      return ResponseHelper.ok(reply, "Editorial look products retrieved successfully", productIds);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async getProductLooks(
    request: AuthenticatedRequest<{ Params: ProductLooksParams }>,
    reply: FastifyReply,
  ) {
    try {
      const lookIds = await this.getProductEditorialLooksHandler.handle({ productId: request.params.productId });
      return ResponseHelper.ok(reply, "Product looks retrieved successfully", lookIds);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async getLooksByProduct(
    request: AuthenticatedRequest<{
      Params: ProductLooksParams;
      Querystring: ListEditorialLooksQuery;
    }>,
    reply: FastifyReply,
  ) {
    try {
      const { page, limit, includeUnpublished, sortBy, sortOrder } = request.query;
      const result = await this.getEditorialLooksByProductHandler.handle({
        productId: request.params.productId,
        page,
        limit,
        includeUnpublished,
        sortBy,
        sortOrder,
      });
      return ResponseHelper.ok(reply, "Looks by product retrieved successfully", result);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async getEditorialLookStats(_request: AuthenticatedRequest, reply: FastifyReply) {
    try {
      const stats = await this.getEditorialLookStatsHandler.handle({});
      return ResponseHelper.ok(reply, "Editorial look statistics retrieved successfully", stats);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async getPopularProducts(
    request: AuthenticatedRequest<{ Querystring: PopularProductsQuery }>,
    reply: FastifyReply,
  ) {
    try {
      const popularProducts = await this.getPopularEditorialLookProductsHandler.handle(request.query);
      return ResponseHelper.ok(reply, "Popular products retrieved successfully", popularProducts);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async validateForPublication(
    request: AuthenticatedRequest<{ Params: EditorialLookParams }>,
    reply: FastifyReply,
  ) {
    try {
      const validation = await this.validateEditorialLookForPublicationHandler.handle({ id: request.params.id });
      return ResponseHelper.ok(reply, "Editorial look validated for publication", validation);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  // ── Writes ─────────────────────────────────────────────────────────────

  async createEditorialLook(
    request: AuthenticatedRequest<{ Body: CreateEditorialLookBody }>,
    reply: FastifyReply,
  ) {
    try {
      const result = await this.createEditorialLookHandler.handle(request.body);
      return ResponseHelper.fromCommand(reply, result, "Editorial look created successfully", 201);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async createBulkEditorialLooks(
    request: AuthenticatedRequest<{ Body: BulkCreateEditorialLooksBody }>,
    reply: FastifyReply,
  ) {
    try {
      const result = await this.createBulkEditorialLooksHandler.handle({ looks: request.body.looks });
      return ResponseHelper.fromCommand(reply, result, "Editorial looks created successfully", 201);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async duplicateEditorialLook(
    request: AuthenticatedRequest<{ Params: EditorialLookParams; Body: DuplicateEditorialLookBody }>,
    reply: FastifyReply,
  ) {
    try {
      const result = await this.duplicateEditorialLookHandler.handle({
        id: request.params.id,
        newTitle: request.body.newTitle,
      });
      return ResponseHelper.fromCommand(reply, result, "Editorial look duplicated successfully", 201);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async updateEditorialLook(
    request: AuthenticatedRequest<{ Params: EditorialLookParams; Body: UpdateEditorialLookBody }>,
    reply: FastifyReply,
  ) {
    try {
      const { title, storyHtml, heroAssetId, publishedAt } = request.body;
      const result = await this.updateEditorialLookHandler.handle({
        id: request.params.id,
        title,
        storyHtml,
        heroAssetId,
        publishedAt,
      });
      return ResponseHelper.fromCommand(reply, result, "Editorial look updated successfully");
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async publishEditorialLook(
    request: AuthenticatedRequest<{ Params: EditorialLookParams }>,
    reply: FastifyReply,
  ) {
    try {
      const result = await this.publishEditorialLookHandler.handle({ id: request.params.id });
      return ResponseHelper.fromCommand(reply, result, "Editorial look published successfully");
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async unpublishEditorialLook(
    request: AuthenticatedRequest<{ Params: EditorialLookParams }>,
    reply: FastifyReply,
  ) {
    try {
      const result = await this.unpublishEditorialLookHandler.handle({ id: request.params.id });
      return ResponseHelper.fromCommand(reply, result, "Editorial look unpublished successfully");
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async publishBulkEditorialLooks(
    request: AuthenticatedRequest<{ Body: BulkPublishEditorialLooksBody }>,
    reply: FastifyReply,
  ) {
    try {
      const result = await this.publishBulkEditorialLooksHandler.handle({ ids: request.body.ids });
      return ResponseHelper.fromCommand(reply, result, "Editorial looks published successfully");
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async schedulePublication(
    request: AuthenticatedRequest<{ Params: EditorialLookParams; Body: SchedulePublicationBody }>,
    reply: FastifyReply,
  ) {
    try {
      const result = await this.scheduleEditorialLookPublicationHandler.handle({
        id: request.params.id,
        publishDate: request.body.publishDate,
      });
      return ResponseHelper.fromCommand(reply, result, "Editorial look scheduled for publication successfully");
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async processScheduledPublications(_request: AuthenticatedRequest, reply: FastifyReply) {
    try {
      const result = await this.processScheduledEditorialLookPublicationsHandler.handle({});
      return ResponseHelper.fromCommand(reply, result, "Scheduled editorial look publications processed");
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async setHeroImage(
    request: AuthenticatedRequest<{ Params: EditorialLookParams; Body: SetHeroImageBody }>,
    reply: FastifyReply,
  ) {
    try {
      const result = await this.setEditorialLookHeroImageHandler.handle({
        id: request.params.id,
        assetId: request.body.assetId,
      });
      return ResponseHelper.fromCommand(reply, result, "Hero image set successfully");
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async removeHeroImage(
    request: AuthenticatedRequest<{ Params: EditorialLookParams }>,
    reply: FastifyReply,
  ) {
    try {
      const result = await this.removeEditorialLookHeroImageHandler.handle({ id: request.params.id });
      return ResponseHelper.fromCommand(reply, result, "Hero image removed successfully", undefined, 204);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async addProductToLook(
    request: AuthenticatedRequest<{ Params: EditorialLookProductParams }>,
    reply: FastifyReply,
  ) {
    try {
      const result = await this.addProductToEditorialLookHandler.handle({
        id: request.params.id,
        productId: request.params.productId,
      });
      return ResponseHelper.fromCommand(reply, result, "Product added to look successfully", undefined, 204);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async removeProductFromLook(
    request: AuthenticatedRequest<{ Params: EditorialLookProductParams }>,
    reply: FastifyReply,
  ) {
    try {
      const result = await this.removeProductFromEditorialLookHandler.handle({
        id: request.params.id,
        productId: request.params.productId,
      });
      return ResponseHelper.fromCommand(reply, result, "Product removed from look successfully", undefined, 204);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async setLookProducts(
    request: AuthenticatedRequest<{ Params: EditorialLookParams; Body: SetLookProductsBody }>,
    reply: FastifyReply,
  ) {
    try {
      const result = await this.setEditorialLookProductsHandler.handle({
        id: request.params.id,
        productIds: request.body.productIds,
      });
      return ResponseHelper.fromCommand(reply, result, "Editorial look products updated successfully");
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async updateStoryContent(
    request: AuthenticatedRequest<{ Params: EditorialLookParams; Body: UpdateStoryContentBody }>,
    reply: FastifyReply,
  ) {
    try {
      const result = await this.updateEditorialLookStoryContentHandler.handle({
        id: request.params.id,
        storyHtml: request.body.storyHtml,
      });
      return ResponseHelper.fromCommand(reply, result, "Story content updated successfully");
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async clearStoryContent(
    request: AuthenticatedRequest<{ Params: EditorialLookParams }>,
    reply: FastifyReply,
  ) {
    try {
      const result = await this.clearEditorialLookStoryContentHandler.handle({ id: request.params.id });
      return ResponseHelper.fromCommand(reply, result, "Story content cleared successfully", undefined, 204);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async deleteEditorialLook(
    request: AuthenticatedRequest<{ Params: EditorialLookParams }>,
    reply: FastifyReply,
  ) {
    try {
      const result = await this.deleteEditorialLookHandler.handle({ id: request.params.id });
      return ResponseHelper.fromCommand(reply, result, "Editorial look deleted successfully", undefined, 204);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async deleteBulkEditorialLooks(
    request: AuthenticatedRequest<{ Body: BulkDeleteEditorialLooksBody }>,
    reply: FastifyReply,
  ) {
    try {
      const result = await this.deleteBulkEditorialLooksHandler.handle({ ids: request.body.ids });
      return ResponseHelper.fromCommand(reply, result, "Editorial looks deleted successfully", undefined, 204);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }
}
