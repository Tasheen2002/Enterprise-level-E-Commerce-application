import { FastifyReply } from "fastify";
import { AuthenticatedRequest } from "@/api/src/shared/interfaces/authenticated-request.interface";
import {
  CreateSizeGuideHandler,
  UpdateSizeGuideHandler,
  DeleteSizeGuideHandler,
  CreateRegionalSizeGuideHandler,
  CreateCategorySizeGuideHandler,
  UpdateSizeGuideContentHandler,
  ClearSizeGuideContentHandler,
  CreateBulkSizeGuidesHandler,
  DeleteBulkSizeGuidesHandler,
  ListSizeGuidesHandler,
  GetSizeGuideHandler,
  GetRegionalSizeGuidesHandler,
  GetGeneralSizeGuidesHandler,
  GetSizeGuideStatsHandler,
  GetAvailableSizeGuideRegionsHandler,
  GetAvailableSizeGuideCategoriesHandler,
  ValidateSizeGuideUniquenessHandler,
} from "../../../application";
import { ResponseHelper } from "@/api/src/shared/response.helper";
import {
  SizeGuideParams,
  RegionParams,
  RegionCategoryParams,
  ListSizeGuidesQuery,
  ValidateSizeGuideQuery,
  CategoriesQuery,
  CreateSizeGuideBody,
  UpdateSizeGuideBody,
  UpdateSizeGuideContentBody,
  BulkCreateSizeGuidesBody,
  BulkDeleteSizeGuidesBody,
  RegionalSizeGuideBody,
} from "../validation/size-guide.schema";

export class SizeGuideController {
  constructor(
    private readonly createSizeGuideHandler: CreateSizeGuideHandler,
    private readonly updateSizeGuideHandler: UpdateSizeGuideHandler,
    private readonly deleteSizeGuideHandler: DeleteSizeGuideHandler,
    private readonly createRegionalSizeGuideHandler: CreateRegionalSizeGuideHandler,
    private readonly createCategorySizeGuideHandler: CreateCategorySizeGuideHandler,
    private readonly updateSizeGuideContentHandler: UpdateSizeGuideContentHandler,
    private readonly clearSizeGuideContentHandler: ClearSizeGuideContentHandler,
    private readonly createBulkSizeGuidesHandler: CreateBulkSizeGuidesHandler,
    private readonly deleteBulkSizeGuidesHandler: DeleteBulkSizeGuidesHandler,
    private readonly listSizeGuidesHandler: ListSizeGuidesHandler,
    private readonly getSizeGuideHandler: GetSizeGuideHandler,
    private readonly getRegionalSizeGuidesHandler: GetRegionalSizeGuidesHandler,
    private readonly getGeneralSizeGuidesHandler: GetGeneralSizeGuidesHandler,
    private readonly getSizeGuideStatsHandler: GetSizeGuideStatsHandler,
    private readonly getAvailableSizeGuideRegionsHandler: GetAvailableSizeGuideRegionsHandler,
    private readonly getAvailableSizeGuideCategoriesHandler: GetAvailableSizeGuideCategoriesHandler,
    private readonly validateSizeGuideUniquenessHandler: ValidateSizeGuideUniquenessHandler,
  ) {}

  // ── Reads ──────────────────────────────────────────────────────────────

  async getSizeGuides(
    request: AuthenticatedRequest<{ Querystring: ListSizeGuidesQuery }>,
    reply: FastifyReply,
  ) {
    try {
      const result = await this.listSizeGuidesHandler.handle(request.query);
      return ResponseHelper.ok(reply, "Size guides retrieved successfully", result);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async getSizeGuide(
    request: AuthenticatedRequest<{ Params: SizeGuideParams }>,
    reply: FastifyReply,
  ) {
    try {
      const guide = await this.getSizeGuideHandler.handle({ id: request.params.id });
      return ResponseHelper.ok(reply, "Size guide retrieved successfully", guide);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async getRegionalSizeGuides(
    request: AuthenticatedRequest<{ Params: RegionParams; Querystring: ListSizeGuidesQuery }>,
    reply: FastifyReply,
  ) {
    try {
      // Param-region overrides any same-named query field; underscore signals intentional discard.
      const { region: _ignored, ...queryRest } = request.query;
      const result = await this.getRegionalSizeGuidesHandler.handle({
        region: request.params.region,
        ...queryRest,
      });
      return ResponseHelper.ok(reply, "Regional size guides retrieved successfully", result);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async getGeneralSizeGuides(
    request: AuthenticatedRequest<{ Params: RegionParams }>,
    reply: FastifyReply,
  ) {
    try {
      const result = await this.getGeneralSizeGuidesHandler.handle({ region: request.params.region });
      return ResponseHelper.ok(reply, "General size guides retrieved successfully", result);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async getSizeGuideStats(_request: AuthenticatedRequest, reply: FastifyReply) {
    try {
      const stats = await this.getSizeGuideStatsHandler.handle({});
      return ResponseHelper.ok(reply, "Size guide statistics retrieved successfully", stats);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async getAvailableRegions(_request: AuthenticatedRequest, reply: FastifyReply) {
    try {
      const regions = await this.getAvailableSizeGuideRegionsHandler.handle({});
      return ResponseHelper.ok(reply, "Available regions retrieved successfully", regions);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async getAvailableCategories(
    request: AuthenticatedRequest<{ Querystring: CategoriesQuery }>,
    reply: FastifyReply,
  ) {
    try {
      const result = await this.getAvailableSizeGuideCategoriesHandler.handle(request.query);
      return ResponseHelper.ok(reply, "Available categories retrieved successfully", result);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async validateUniqueness(
    request: AuthenticatedRequest<{ Querystring: ValidateSizeGuideQuery }>,
    reply: FastifyReply,
  ) {
    try {
      const result = await this.validateSizeGuideUniquenessHandler.handle(request.query);
      return ResponseHelper.ok(reply, "Size guide uniqueness validated", result);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  // ── Writes ─────────────────────────────────────────────────────────────

  async createSizeGuide(
    request: AuthenticatedRequest<{ Body: CreateSizeGuideBody }>,
    reply: FastifyReply,
  ) {
    try {
      const result = await this.createSizeGuideHandler.handle(request.body);
      return ResponseHelper.fromCommand(reply, result, "Size guide created successfully", 201);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async createBulkSizeGuides(
    request: AuthenticatedRequest<{ Body: BulkCreateSizeGuidesBody }>,
    reply: FastifyReply,
  ) {
    try {
      const result = await this.createBulkSizeGuidesHandler.handle({ guides: request.body.guides });
      return ResponseHelper.fromCommand(reply, result, "Size guides created successfully", 201);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async createRegionalSizeGuide(
    request: AuthenticatedRequest<{ Params: RegionParams; Body: RegionalSizeGuideBody }>,
    reply: FastifyReply,
  ) {
    try {
      const result = await this.createRegionalSizeGuideHandler.handle({
        region: request.params.region,
        title: request.body.title,
        bodyHtml: request.body.bodyHtml,
        category: request.body.category,
      });
      return ResponseHelper.fromCommand(reply, result, "Regional size guide created successfully", 201);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async createCategorySizeGuide(
    request: AuthenticatedRequest<{ Params: RegionCategoryParams; Body: RegionalSizeGuideBody }>,
    reply: FastifyReply,
  ) {
    try {
      const result = await this.createCategorySizeGuideHandler.handle({
        category: request.params.category,
        region: request.params.region,
        title: request.body.title,
        bodyHtml: request.body.bodyHtml,
      });
      return ResponseHelper.fromCommand(reply, result, "Category size guide created successfully", 201);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async updateSizeGuide(
    request: AuthenticatedRequest<{ Params: SizeGuideParams; Body: UpdateSizeGuideBody }>,
    reply: FastifyReply,
  ) {
    try {
      const result = await this.updateSizeGuideHandler.handle({
        id: request.params.id,
        title: request.body.title,
        bodyHtml: request.body.bodyHtml,
        region: request.body.region,
        category: request.body.category,
      });
      return ResponseHelper.fromCommand(reply, result, "Size guide updated successfully");
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async updateSizeGuideContent(
    request: AuthenticatedRequest<{ Params: SizeGuideParams; Body: UpdateSizeGuideContentBody }>,
    reply: FastifyReply,
  ) {
    try {
      const result = await this.updateSizeGuideContentHandler.handle({
        id: request.params.id,
        htmlContent: request.body.htmlContent,
      });
      return ResponseHelper.fromCommand(reply, result, "Size guide content updated successfully");
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async clearSizeGuideContent(
    request: AuthenticatedRequest<{ Params: SizeGuideParams }>,
    reply: FastifyReply,
  ) {
    try {
      const result = await this.clearSizeGuideContentHandler.handle({ id: request.params.id });
      return ResponseHelper.fromCommand(reply, result, "Size guide content cleared successfully", undefined, 204);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async deleteSizeGuide(
    request: AuthenticatedRequest<{ Params: SizeGuideParams }>,
    reply: FastifyReply,
  ) {
    try {
      const result = await this.deleteSizeGuideHandler.handle({ id: request.params.id });
      return ResponseHelper.fromCommand(reply, result, "Size guide deleted successfully", undefined, 204);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async deleteBulkSizeGuides(
    request: AuthenticatedRequest<{ Body: BulkDeleteSizeGuidesBody }>,
    reply: FastifyReply,
  ) {
    try {
      const result = await this.deleteBulkSizeGuidesHandler.handle({ ids: request.body.ids });
      return ResponseHelper.fromCommand(reply, result, "Size guides deleted successfully", undefined, 204);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }
}
