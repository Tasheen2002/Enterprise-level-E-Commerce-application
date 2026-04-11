import { FastifyReply } from "fastify";
import { AuthenticatedRequest } from "@/api/src/shared/interfaces/authenticated-request.interface";
import { SizeGuideManagementService } from "../../../application/services/size-guide-management.service";
import { Region } from "../../../domain/entities/size-guide.entity";
import { SizeGuideQueryOptions } from "../../../domain/repositories/size-guide.repository";
import { ResponseHelper } from "@/api/src/shared/response.helper";

export interface CreateSizeGuideRequest {
  title: string;
  bodyHtml?: string;
  region: Region;
  category?: string;
}

export interface UpdateSizeGuideRequest {
  title?: string;
  bodyHtml?: string;
  region?: Region;
  category?: string;
}

export interface SizeGuideQueryParams {
  page?: number;
  limit?: number;
  region?: Region;
  category?: string;
  hasContent?: boolean;
  sortBy?: "title" | "region" | "category";
  sortOrder?: "asc" | "desc";
}

export interface BulkCreateSizeGuidesRequest {
  guides: CreateSizeGuideRequest[];
}

export interface BulkDeleteSizeGuidesRequest {
  ids: string[];
}

export interface ValidateSizeGuideQueryParams {
  region: string;
  category?: string;
}

export interface RegionalSizeGuideRequest extends Omit<
  CreateSizeGuideRequest,
  "region"
> {}

export interface CategorySizeGuideRequest extends Omit<
  CreateSizeGuideRequest,
  "category" | "region"
> {}

export class SizeGuideController {
  constructor(
    private readonly sizeGuideManagementService: SizeGuideManagementService,
  ) {}

  async getSizeGuides(
    request: AuthenticatedRequest<{ Querystring: SizeGuideQueryParams }>,
    reply: FastifyReply,
  ) {
    try {
      const {
        page = 1,
        limit = 20,
        region,
        category,
        hasContent,
        sortBy = "title",
        sortOrder = "desc",
      } = request.query;

      const serviceOptions: SizeGuideQueryOptions = {
        limit: Math.min(100, Math.max(1, limit)),
        offset: (Math.max(1, page) - 1) * Math.min(100, Math.max(1, limit)),
        sortBy,
        sortOrder,
        hasContent,
      };

      const pageOptions = {
        page: Math.max(1, page),
        limit: Math.min(100, Math.max(1, limit)),
        sortBy,
        sortOrder,
      };

      let guides;

      if (region && category) {
        guides = [
          await this.sizeGuideManagementService.getSizeGuideByRegionAndCategory(
            region,
            category,
          ),
        ].filter(Boolean);
      } else if (region) {
        guides = await this.sizeGuideManagementService.getSizeGuidesByRegion(
          region,
          serviceOptions,
        );
      } else if (category) {
        guides = await this.sizeGuideManagementService.getSizeGuidesByCategory(
          category,
          serviceOptions,
        );
      } else if (hasContent !== undefined) {
        guides = hasContent
          ? await this.sizeGuideManagementService.getSizeGuidesWithContent(
              serviceOptions,
            )
          : await this.sizeGuideManagementService.getSizeGuidesWithoutContent(
              serviceOptions,
            );
      } else {
        guides =
          await this.sizeGuideManagementService.getAllSizeGuides(
            serviceOptions,
          );
      }

      const serializedGuides = Array.isArray(guides) ? guides.filter(Boolean) : guides;

      return ResponseHelper.ok(reply, "Size guides retrieved successfully", {
        sizeGuides: serializedGuides,
        pagination: {
          page: pageOptions.page,
          limit: pageOptions.limit,
          total: serializedGuides.length,
          total_pages: Math.ceil(serializedGuides.length / pageOptions.limit),
        },
      });
    } catch (error) {
      return ResponseHelper.error(reply, error);
    }
  }

  async getSizeGuide(
    request: AuthenticatedRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const { id } = request.params;

      const guide = await this.sizeGuideManagementService.getSizeGuideById(id);

      return ResponseHelper.ok(
        reply,
        "Size guide retrieved successfully",
        guide,
      );
    } catch (error) {
      return ResponseHelper.error(reply, error);
    }
  }

  async createSizeGuide(
    request: AuthenticatedRequest<{ Body: CreateSizeGuideRequest }>,
    reply: FastifyReply,
  ) {
    try {
      const guideData = request.body;

      const guide = await this.sizeGuideManagementService.createSizeGuide(guideData);

      return ResponseHelper.created(
        reply,
        "Size guide created successfully",
        guide,
      );
    } catch (error) {
      if (error instanceof Error && error.message.includes("already exists")) {
        return reply.status(409).send({
          success: false,
          statusCode: 409,
          error: "Conflict",
          message:
            "Size guide already exists for this region and category combination",
        });
      }

      return ResponseHelper.error(reply, error);
    }
  }

  async updateSizeGuide(
    request: AuthenticatedRequest<{
      Params: { id: string };
      Body: UpdateSizeGuideRequest;
    }>,
    reply: FastifyReply,
  ) {
    try {
      const { id } = request.params;
      const updateData = request.body;

      const guide = await this.sizeGuideManagementService.updateSizeGuide(
        id,
        updateData,
      );

      return ResponseHelper.ok(reply, "Size guide updated successfully", guide);
    } catch (error) {
      if (error instanceof Error && error.message.includes("already exists")) {
        return reply.status(409).send({
          success: false,
          statusCode: 409,
          error: "Conflict",
          message:
            "Size guide already exists for this region and category combination",
        });
      }

      return ResponseHelper.error(reply, error);
    }
  }

  async deleteSizeGuide(
    request: AuthenticatedRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const { id } = request.params;

      await this.sizeGuideManagementService.deleteSizeGuide(id);

      return ResponseHelper.noContent(reply);
    } catch (error) {
      return ResponseHelper.error(reply, error);
    }
  }

  async getRegionalSizeGuides(
    request: AuthenticatedRequest<{
      Params: { region: string };
      Querystring: Omit<SizeGuideQueryParams, "region">;
    }>,
    reply: FastifyReply,
  ) {
    try {
      const { region } = request.params;
      const {
        page = 1,
        limit = 20,
        category,
        hasContent,
        sortBy = "title",
        sortOrder = "desc",
      } = request.query;

      const serviceOptions: SizeGuideQueryOptions = {
        limit: Math.min(100, Math.max(1, limit)),
        offset: (Math.max(1, page) - 1) * Math.min(100, Math.max(1, limit)),
        sortBy,
        sortOrder,
        hasContent,
      };

      const pageOptions = {
        page: Math.max(1, page),
        limit: Math.min(100, Math.max(1, limit)),
      };

      let guides;
      if (category) {
        const guide =
          await this.sizeGuideManagementService.getSizeGuideByRegionAndCategory(
            region as Region,
            category,
          );
        guides = guide ? [guide] : [];
      } else {
        guides = await this.sizeGuideManagementService.getSizeGuidesByRegion(
          region as Region,
          serviceOptions,
        );
      }

      const serializedGuides = Array.isArray(guides) ? guides.filter(Boolean) : [];

      return ResponseHelper.ok(
        reply,
        "Regional size guides retrieved successfully",
        {
          sizeGuides: serializedGuides,
          pagination: {
            page: pageOptions.page,
            limit: pageOptions.limit,
            total: serializedGuides.length,
            total_pages: Math.ceil(serializedGuides.length / pageOptions.limit),
          },
          meta: {
            region,
            page: pageOptions.page,
            limit: pageOptions.limit,
          },
        },
      );
    } catch (error) {
      return ResponseHelper.error(reply, error);
    }
  }

  async createRegionalSizeGuide(
    request: AuthenticatedRequest<{
      Params: { region: string };
      Body: RegionalSizeGuideRequest;
    }>,
    reply: FastifyReply,
  ) {
    try {
      const { region } = request.params;
      const guideData = request.body;

      const guide =
        await this.sizeGuideManagementService.createRegionalSizeGuide(
          region as Region,
          guideData,
        );

      return ResponseHelper.created(
        reply,
        "Regional size guide created successfully",
        guide,
      );
    } catch (error) {
      if (error instanceof Error && error.message.includes("already exists")) {
        return reply.status(409).send({
          success: false,
          statusCode: 409,
          error: "Conflict",
          message:
            "Size guide already exists for this region and category combination",
        });
      }

      return ResponseHelper.error(reply, error);
    }
  }

  async getGeneralSizeGuides(
    request: AuthenticatedRequest<{ Params: { region: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const { region } = request.params;

      const guides = await this.sizeGuideManagementService.getGeneralSizeGuides(
        region as Region,
      );

      return ResponseHelper.ok(
        reply,
        "General size guides retrieved successfully",
        {
          guides,
          meta: {
            region,
            count: guides.length,
          },
        },
      );
    } catch (error) {
      return ResponseHelper.error(reply, error);
    }
  }

  async createCategorySizeGuide(
    request: AuthenticatedRequest<{
      Params: { category: string; region: string };
      Body: CategorySizeGuideRequest;
    }>,
    reply: FastifyReply,
  ) {
    try {
      const { category, region } = request.params;
      const guideData = request.body;

      const guide =
        await this.sizeGuideManagementService.createCategorySizeGuide(
          decodeURIComponent(category),
          region as Region,
          guideData,
        );

      return ResponseHelper.created(
        reply,
        "Category size guide created successfully",
        guide,
      );
    } catch (error) {
      if (error instanceof Error && error.message.includes("already exists")) {
        return reply.status(409).send({
          success: false,
          statusCode: 409,
          error: "Conflict",
          message:
            "Size guide already exists for this region and category combination",
        });
      }

      return ResponseHelper.error(reply, error);
    }
  }

  async updateSizeGuideContent(
    request: AuthenticatedRequest<{
      Params: { id: string };
      Body: { htmlContent: string };
    }>,
    reply: FastifyReply,
  ) {
    try {
      const { id } = request.params;
      const { htmlContent } = request.body;

      const guide =
        await this.sizeGuideManagementService.updateSizeGuideContent(
          id,
          htmlContent,
        );

      return ResponseHelper.ok(
        reply,
        "Size guide content updated successfully",
        guide,
      );
    } catch (error) {
      return ResponseHelper.error(reply, error);
    }
  }

  async clearSizeGuideContent(
    request: AuthenticatedRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const { id } = request.params;

      await this.sizeGuideManagementService.clearSizeGuideContent(id);

      return ResponseHelper.noContent(reply);
    } catch (error) {
      return ResponseHelper.error(reply, error);
    }
  }

  async getSizeGuideStats(request: AuthenticatedRequest, reply: FastifyReply) {
    try {
      const stats = await this.sizeGuideManagementService.getSizeGuideStats();
      return ResponseHelper.ok(
        reply,
        "Size guide statistics retrieved successfully",
        stats,
      );
    } catch (error) {
      return ResponseHelper.error(reply, error);
    }
  }

  async getAvailableRegions(request: AuthenticatedRequest, reply: FastifyReply) {
    try {
      const regions =
        await this.sizeGuideManagementService.getAvailableRegions();

      return ResponseHelper.ok(
        reply,
        "Available regions retrieved successfully",
        regions,
      );
    } catch (error) {
      return ResponseHelper.error(reply, error);
    }
  }

  async getAvailableCategories(
    request: AuthenticatedRequest<{ Querystring: { region?: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const { region } = request.query;

      const categories =
        await this.sizeGuideManagementService.getAvailableCategories(
          region as Region,
        );

      return ResponseHelper.ok(
        reply,
        "Available categories retrieved successfully",
        {
          categories,
          meta: {
            region: region || "all",
          },
        },
      );
    } catch (error) {
      return ResponseHelper.error(reply, error);
    }
  }

  async createBulkSizeGuides(
    request: AuthenticatedRequest<{ Body: BulkCreateSizeGuidesRequest }>,
    reply: FastifyReply,
  ) {
    try {
      const { guides } = request.body;

      const result =
        await this.sizeGuideManagementService.createMultipleSizeGuides(guides);

      return ResponseHelper.created(
        reply,
        `${result.created.length} size guides created successfully${result.skipped.length > 0 ? `, ${result.skipped.length} skipped` : ""}`,
        result,
      );
    } catch (error) {
      return ResponseHelper.error(reply, error);
    }
  }

  async deleteBulkSizeGuides(
    request: AuthenticatedRequest<{ Body: BulkDeleteSizeGuidesRequest }>,
    reply: FastifyReply,
  ) {
    try {
      const { ids } = request.body;

      await this.sizeGuideManagementService.deleteMultipleSizeGuides(ids);

      return ResponseHelper.noContent(reply);
    } catch (error) {
      return ResponseHelper.error(reply, error);
    }
  }

  async validateUniqueness(
    request: AuthenticatedRequest<{
      Querystring: ValidateSizeGuideQueryParams;
    }>,
    reply: FastifyReply,
  ) {
    try {
      const { region, category } = request.query;

      const isUnique =
        await this.sizeGuideManagementService.validateSizeGuideUniqueness(
          region as Region,
          category || null,
        );

      return ResponseHelper.ok(reply, "Size guide uniqueness validated", {
        region,
        category: category || null,
        isUnique,
        available: isUnique,
      });
    } catch (error) {
      return ResponseHelper.error(reply, error);
    }
  }
}
