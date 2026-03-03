import { FastifyRequest, FastifyReply } from "fastify";
import { SizeGuideManagementService } from "../../../application/services/size-guide-management.service";
import {
  Region,
  CreateSizeGuideData,
} from "../../../domain/entities/size-guide.entity";
import { SizeGuideQueryOptions } from "../../../domain/repositories/size-guide.repository";

interface CreateSizeGuideRequest {
  title: string;
  bodyHtml?: string;
  region: Region;
  category?: string;
}

interface UpdateSizeGuideRequest {
  title?: string;
  bodyHtml?: string;
  region?: Region;
  category?: string;
}

interface SizeGuideQueryParams {
  page?: number;
  limit?: number;
  region?: Region;
  category?: string;
  hasContent?: boolean;
  sortBy?: "title" | "region" | "category";
  sortOrder?: "asc" | "desc";
}

interface BulkCreateSizeGuidesRequest {
  guides: CreateSizeGuideRequest[];
}

interface BulkDeleteSizeGuidesRequest {
  ids: string[];
}

interface RegionalSizeGuideRequest extends Omit<
  CreateSizeGuideRequest,
  "region"
> {}

interface CategorySizeGuideRequest extends Omit<
  CreateSizeGuideRequest,
  "category" | "region"
> {}

export class SizeGuideController {
  constructor(
    private readonly sizeGuideManagementService: SizeGuideManagementService,
  ) {}

  async getSizeGuides(
    request: FastifyRequest<{ Querystring: SizeGuideQueryParams }>,
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

      console.log("Size guides retrieved:", guides);

      // Serialize entities to plain objects
      const serializedGuides = Array.isArray(guides)
        ? guides
            .map((guide) => (guide?.toData ? guide.toData() : guide))
            .filter(Boolean)
        : guides;

      console.log("Serialized guides:", serializedGuides);

      return reply.code(200).send({
        success: true,
        data: {
          sizeGuides: serializedGuides,
          pagination: {
            page: pageOptions.page,
            limit: pageOptions.limit,
            total: serializedGuides.length,
            total_pages: Math.ceil(serializedGuides.length / pageOptions.limit),
          },
        },
      });
    } catch (error) {
      console.error("=== Size guides list error ===");
      console.error("Error:", error);
      console.error(
        "Error message:",
        error instanceof Error ? error.message : "Unknown",
      );
      console.error(
        "Error stack:",
        error instanceof Error ? error.stack : "No stack",
      );

      request.log.error(error, "Failed to get size guides");
      return reply.code(500).send({
        success: false,
        error: "Internal server error",
        message: "Failed to retrieve size guides",
      });
    }
  }

  async getSizeGuide(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const { id } = request.params;

      if (!id || typeof id !== "string") {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: "Size guide ID is required and must be a valid string",
        });
      }

      const guide = await this.sizeGuideManagementService.getSizeGuideById(id);

      return reply.code(200).send({
        success: true,
        data: guide,
      });
    } catch (error) {
      request.log.error(error, "Failed to get size guide");

      if (error instanceof Error && error.message.includes("not found")) {
        return reply.code(404).send({
          success: false,
          error: "Not Found",
          message: "Size guide not found",
        });
      }

      return reply.code(500).send({
        success: false,
        error: "Internal server error",
        message: "Failed to retrieve size guide",
      });
    }
  }

  async createSizeGuide(
    request: FastifyRequest<{ Body: CreateSizeGuideRequest }>,
    reply: FastifyReply,
  ) {
    try {
      const guideData = request.body;

      // Basic validation
      if (
        !guideData.title ||
        typeof guideData.title !== "string" ||
        guideData.title.trim().length === 0
      ) {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: "Title is required and must be a non-empty string",
        });
      }

      if (
        !guideData.region ||
        !Object.values(Region).includes(guideData.region)
      ) {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: "Region is required and must be one of: UK, US, EU",
        });
      }

      // Validate title length
      if (guideData.title.length > 200) {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: "Title cannot be longer than 200 characters",
        });
      }

      // Validate HTML content length if provided
      if (guideData.bodyHtml && guideData.bodyHtml.length > 50000) {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: "HTML content cannot exceed 50,000 characters",
        });
      }

      const guide = await this.sizeGuideManagementService.createSizeGuide(
        guideData as CreateSizeGuideData,
      );

      return reply.code(201).send({
        success: true,
        data: guide,
        message: "Size guide created successfully",
      });
    } catch (error) {
      request.log.error(error, "Failed to create size guide");

      if (error instanceof Error && error.message.includes("already exists")) {
        return reply.code(409).send({
          success: false,
          error: "Conflict",
          message:
            "Size guide already exists for this region and category combination",
        });
      }

      return reply.code(500).send({
        success: false,
        error: "Internal server error",
        message: "Failed to create size guide",
      });
    }
  }

  async updateSizeGuide(
    request: FastifyRequest<{
      Params: { id: string };
      Body: UpdateSizeGuideRequest;
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
          message: "Size guide ID is required and must be a valid string",
        });
      }

      // Validate title if provided
      if (updateData.title !== undefined) {
        if (
          typeof updateData.title !== "string" ||
          updateData.title.trim().length === 0
        ) {
          return reply.code(400).send({
            success: false,
            error: "Bad Request",
            message: "Title must be a non-empty string",
          });
        }

        if (updateData.title.length > 200) {
          return reply.code(400).send({
            success: false,
            error: "Bad Request",
            message: "Title cannot be longer than 200 characters",
          });
        }
      }

      // Validate region if provided
      if (
        updateData.region &&
        !Object.values(Region).includes(updateData.region)
      ) {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: "Region must be one of: UK, US, EU",
        });
      }

      // Validate HTML content if provided
      if (
        updateData.bodyHtml !== undefined &&
        updateData.bodyHtml &&
        updateData.bodyHtml.length > 50000
      ) {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: "HTML content cannot exceed 50,000 characters",
        });
      }

      console.log("Updating size guide with ID:", id);
      console.log("Update data:", updateData);

      const guide = await this.sizeGuideManagementService.updateSizeGuide(
        id,
        updateData,
      );

      console.log("Updated guide:", guide);

      // Serialize entity to plain object
      const serializedGuide = guide.toData ? guide.toData() : guide;

      return reply.code(200).send({
        success: true,
        data: serializedGuide,
        message: "Size guide updated successfully",
      });
    } catch (error) {
      console.error("=== Size guide update error ===");
      console.error("Error:", error);
      console.error(
        "Error message:",
        error instanceof Error ? error.message : "Unknown",
      );
      console.error(
        "Error stack:",
        error instanceof Error ? error.stack : "No stack",
      );

      request.log.error(error, "Failed to update size guide");

      if (error instanceof Error && error.message.includes("not found")) {
        return reply.code(404).send({
          success: false,
          error: "Not Found",
          message: "Size guide not found",
        });
      }

      if (error instanceof Error && error.message.includes("already exists")) {
        return reply.code(409).send({
          success: false,
          error: "Conflict",
          message:
            "Size guide already exists for this region and category combination",
        });
      }

      return reply.code(500).send({
        success: false,
        error: "Internal server error",
        message: "Failed to update size guide",
      });
    }
  }

  async deleteSizeGuide(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const { id } = request.params;

      if (!id || typeof id !== "string") {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: "Size guide ID is required and must be a valid string",
        });
      }

      await this.sizeGuideManagementService.deleteSizeGuide(id);

      return reply.code(200).send({
        success: true,
        message: "Size guide deleted successfully",
      });
    } catch (error) {
      request.log.error(error, "Failed to delete size guide");

      if (error instanceof Error && error.message.includes("not found")) {
        return reply.code(404).send({
          success: false,
          error: "Not Found",
          message: "Size guide not found",
        });
      }

      return reply.code(500).send({
        success: false,
        error: "Internal server error",
        message: "Failed to delete size guide",
      });
    }
  }

  async getRegionalSizeGuides(
    request: FastifyRequest<{
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

      if (!Object.values(Region).includes(region as Region)) {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: "Region must be one of: UK, US, EU",
        });
      }

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

      // Serialize entities to plain objects
      const serializedGuides = Array.isArray(guides)
        ? guides
            .map((guide) => (guide?.toData ? guide.toData() : guide))
            .filter(Boolean)
        : [];

      return reply.code(200).send({
        success: true,
        data: {
          sizeGuides: serializedGuides,
          pagination: {
            page: pageOptions.page,
            limit: pageOptions.limit,
            total: serializedGuides.length,
            total_pages: Math.ceil(serializedGuides.length / pageOptions.limit),
          },
        },
        meta: {
          region,
          page: pageOptions.page,
          limit: pageOptions.limit,
        },
      });
    } catch (error) {
      request.log.error(error, "Failed to get regional size guides");
      return reply.code(500).send({
        success: false,
        error: "Internal server error",
        message: "Failed to retrieve regional size guides",
      });
    }
  }

  async createRegionalSizeGuide(
    request: FastifyRequest<{
      Params: { region: string };
      Body: RegionalSizeGuideRequest;
    }>,
    reply: FastifyReply,
  ) {
    try {
      const { region } = request.params;
      const guideData = request.body;

      if (!Object.values(Region).includes(region as Region)) {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: "Region must be one of: UK, US, EU",
        });
      }

      const guide =
        await this.sizeGuideManagementService.createRegionalSizeGuide(
          region as Region,
          guideData,
        );

      return reply.code(201).send({
        success: true,
        data: guide,
        message: "Regional size guide created successfully",
      });
    } catch (error) {
      request.log.error(error, "Failed to create regional size guide");

      if (error instanceof Error && error.message.includes("already exists")) {
        return reply.code(409).send({
          success: false,
          error: "Conflict",
          message:
            "Size guide already exists for this region and category combination",
        });
      }

      return reply.code(500).send({
        success: false,
        error: "Internal server error",
        message: "Failed to create regional size guide",
      });
    }
  }

  async getGeneralSizeGuides(
    request: FastifyRequest<{ Params: { region: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const { region } = request.params;

      if (!Object.values(Region).includes(region as Region)) {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: "Region must be one of: UK, US, EU",
        });
      }

      const guides = await this.sizeGuideManagementService.getGeneralSizeGuides(
        region as Region,
      );

      return reply.code(200).send({
        success: true,
        data: guides,
        meta: {
          region,
          count: guides.length,
        },
      });
    } catch (error) {
      request.log.error(error, "Failed to get general size guides");
      return reply.code(500).send({
        success: false,
        error: "Internal server error",
        message: "Failed to retrieve general size guides",
      });
    }
  }

  async createCategorySizeGuide(
    request: FastifyRequest<{
      Params: { category: string; region: string };
      Body: CategorySizeGuideRequest;
    }>,
    reply: FastifyReply,
  ) {
    try {
      const { category, region } = request.params;
      const guideData = request.body;

      if (!Object.values(Region).includes(region as Region)) {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: "Region must be one of: UK, US, EU",
        });
      }

      const guide =
        await this.sizeGuideManagementService.createCategorySizeGuide(
          decodeURIComponent(category),
          region as Region,
          guideData,
        );

      return reply.code(201).send({
        success: true,
        data: guide,
        message: "Category size guide created successfully",
      });
    } catch (error) {
      request.log.error(error, "Failed to create category size guide");

      if (error instanceof Error && error.message.includes("already exists")) {
        return reply.code(409).send({
          success: false,
          error: "Conflict",
          message:
            "Size guide already exists for this region and category combination",
        });
      }

      return reply.code(500).send({
        success: false,
        error: "Internal server error",
        message: "Failed to create category size guide",
      });
    }
  }

  async updateSizeGuideContent(
    request: FastifyRequest<{
      Params: { id: string };
      Body: { htmlContent: string };
    }>,
    reply: FastifyReply,
  ) {
    try {
      const { id } = request.params;
      const { htmlContent } = request.body;

      if (!id || typeof id !== "string") {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: "Size guide ID is required and must be a valid string",
        });
      }

      if (!htmlContent || typeof htmlContent !== "string") {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: "HTML content is required and must be a string",
        });
      }

      if (htmlContent.length > 50000) {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: "HTML content cannot exceed 50,000 characters",
        });
      }

      const guide =
        await this.sizeGuideManagementService.updateSizeGuideContent(
          id,
          htmlContent,
        );

      return reply.code(200).send({
        success: true,
        data: guide,
        message: "Size guide content updated successfully",
      });
    } catch (error) {
      request.log.error(error, "Failed to update size guide content");

      if (error instanceof Error && error.message.includes("not found")) {
        return reply.code(404).send({
          success: false,
          error: "Not Found",
          message: "Size guide not found",
        });
      }

      return reply.code(500).send({
        success: false,
        error: "Internal server error",
        message: "Failed to update size guide content",
      });
    }
  }

  async clearSizeGuideContent(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const { id } = request.params;

      if (!id || typeof id !== "string") {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: "Size guide ID is required and must be a valid string",
        });
      }

      const guide =
        await this.sizeGuideManagementService.clearSizeGuideContent(id);

      return reply.code(200).send({
        success: true,
        data: guide,
        message: "Size guide content cleared successfully",
      });
    } catch (error) {
      request.log.error(error, "Failed to clear size guide content");

      if (error instanceof Error && error.message.includes("not found")) {
        return reply.code(404).send({
          success: false,
          error: "Not Found",
          message: "Size guide not found",
        });
      }

      return reply.code(500).send({
        success: false,
        error: "Internal server error",
        message: "Failed to clear size guide content",
      });
    }
  }

  async getSizeGuideStats(request: FastifyRequest, reply: FastifyReply) {
    try {
      const stats = await this.sizeGuideManagementService.getSizeGuideStats();

      return reply.code(200).send({
        success: true,
        data: stats,
      });
    } catch (error) {
      request.log.error(error, "Failed to get size guide statistics");
      return reply.code(500).send({
        success: false,
        error: "Internal server error",
        message: "Failed to retrieve size guide statistics",
      });
    }
  }

  async getAvailableRegions(request: FastifyRequest, reply: FastifyReply) {
    try {
      const regions =
        await this.sizeGuideManagementService.getAvailableRegions();

      return reply.code(200).send({
        success: true,
        data: regions,
      });
    } catch (error) {
      request.log.error(error, "Failed to get available regions");
      return reply.code(500).send({
        success: false,
        error: "Internal server error",
        message: "Failed to retrieve available regions",
      });
    }
  }

  async getAvailableCategories(
    request: FastifyRequest<{ Querystring: { region?: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const { region } = request.query;

      if (region && !Object.values(Region).includes(region as Region)) {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: "Region must be one of: UK, US, EU",
        });
      }

      const categories =
        await this.sizeGuideManagementService.getAvailableCategories(
          region as Region,
        );

      return reply.code(200).send({
        success: true,
        data: categories,
        meta: {
          region: region || "all",
        },
      });
    } catch (error) {
      request.log.error(error, "Failed to get available categories");
      return reply.code(500).send({
        success: false,
        error: "Internal server error",
        message: "Failed to retrieve available categories",
      });
    }
  }

  async createBulkSizeGuides(
    request: FastifyRequest<{ Body: BulkCreateSizeGuidesRequest }>,
    reply: FastifyReply,
  ) {
    try {
      const { guides } = request.body;

      if (!guides || !Array.isArray(guides) || guides.length === 0) {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: "Size guides array is required and must not be empty",
        });
      }

      if (guides.length > 50) {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: "Cannot create more than 50 size guides at once",
        });
      }

      // Validate each guide
      for (const guideData of guides) {
        if (!guideData.title || !guideData.region) {
          return reply.code(400).send({
            success: false,
            error: "Bad Request",
            message: "All size guides must have title and region",
          });
        }
      }

      console.log("Creating bulk size guides:", guides);
      const result =
        await this.sizeGuideManagementService.createMultipleSizeGuides(
          guides as CreateSizeGuideData[],
        );
      console.log("Created guides result:", result);

      // Serialize entities to plain objects
      const serializedGuides = Array.isArray(result.created)
        ? result.created
            .map((guide) => (guide?.toData ? guide.toData() : guide))
            .filter(Boolean)
        : [];

      console.log("Serialized guides:", serializedGuides);

      return reply.code(201).send({
        success: true,
        data: {
          created: serializedGuides,
          skipped: result.skipped,
        },
        message: `${serializedGuides.length} size guides created successfully${result.skipped.length > 0 ? `, ${result.skipped.length} skipped` : ""}`,
      });
    } catch (error) {
      console.error("=== Bulk create size guides error ===");
      console.error("Error:", error);
      console.error(
        "Error message:",
        error instanceof Error ? error.message : "Unknown",
      );
      console.error(
        "Error stack:",
        error instanceof Error ? error.stack : "No stack",
      );

      request.log.error(error, "Failed to create bulk size guides");
      return reply.code(500).send({
        success: false,
        error: "Internal server error",
        message: "Failed to create size guides",
      });
    }
  }

  async deleteBulkSizeGuides(
    request: FastifyRequest<{ Body: BulkDeleteSizeGuidesRequest }>,
    reply: FastifyReply,
  ) {
    try {
      const { ids } = request.body;

      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: "Size guide IDs array is required and must not be empty",
        });
      }

      if (ids.length > 50) {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: "Cannot delete more than 50 size guides at once",
        });
      }

      const result =
        await this.sizeGuideManagementService.deleteMultipleSizeGuides(ids);

      return reply.code(200).send({
        success: true,
        data: result,
        message: `${result.deleted.length} size guides deleted successfully`,
      });
    } catch (error) {
      request.log.error(error, "Failed to delete bulk size guides");
      return reply.code(500).send({
        success: false,
        error: "Internal server error",
        message: "Failed to delete size guides",
      });
    }
  }

  async validateUniqueness(
    request: FastifyRequest<{
      Querystring: { region: string; category?: string };
    }>,
    reply: FastifyReply,
  ) {
    try {
      const { region, category } = request.query;

      if (!region || !Object.values(Region).includes(region as Region)) {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: "Region is required and must be one of: UK, US, EU",
        });
      }

      const isUnique =
        await this.sizeGuideManagementService.validateSizeGuideUniqueness(
          region as Region,
          category || null,
        );

      return reply.code(200).send({
        success: true,
        data: {
          region,
          category: category || null,
          isUnique,
          available: isUnique,
        },
      });
    } catch (error) {
      request.log.error(error, "Failed to validate size guide uniqueness");
      return reply.code(500).send({
        success: false,
        error: "Internal server error",
        message: "Failed to validate size guide uniqueness",
      });
    }
  }
}
