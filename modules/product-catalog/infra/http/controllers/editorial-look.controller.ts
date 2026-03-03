import { FastifyRequest, FastifyReply } from "fastify";
import { EditorialLookManagementService } from "../../../application/services/editorial-look-management.service";
import { CreateEditorialLookData } from "../../../domain/entities/editorial-look.entity";
import { EditorialLookQueryOptions } from "../../../domain/repositories/editorial-look.repository";

interface CreateEditorialLookRequest {
  title: string;
  storyHtml?: string;
  heroAssetId?: string;
  publishedAt?: string;
  productIds?: string[];
}

interface UpdateEditorialLookRequest {
  title?: string;
  storyHtml?: string;
  heroAssetId?: string | null;
  publishedAt?: string | null;
}

interface EditorialLookQueryParams {
  page?: number;
  limit?: number;
  published?: boolean;
  scheduled?: boolean;
  draft?: boolean;
  hasContent?: boolean;
  hasHeroImage?: boolean;
  includeUnpublished?: boolean;
  sortBy?: "title" | "publishedAt" | "id";
  sortOrder?: "asc" | "desc";
}

interface BulkCreateEditorialLooksRequest {
  looks: CreateEditorialLookRequest[];
}

interface BulkDeleteEditorialLooksRequest {
  ids: string[];
}

interface BulkPublishEditorialLooksRequest {
  ids: string[];
}

interface SchedulePublicationRequest {
  publishDate: string;
}

interface SetHeroImageRequest {
  assetId: string;
}

interface UpdateStoryContentRequest {
  storyHtml: string;
}

interface SetLookProductsRequest {
  productIds: string[];
}

interface DuplicateEditorialLookRequest {
  newTitle: string;
}

export class EditorialLookController {
  constructor(
    private readonly editorialLookManagementService: EditorialLookManagementService,
  ) {}

  async getEditorialLooks(
    request: FastifyRequest<{ Querystring: EditorialLookQueryParams }>,
    reply: FastifyReply,
  ) {
    try {
      const {
        page = 1,
        limit = 20,
        published,
        scheduled,
        draft,
        hasContent,
        hasHeroImage,
        sortBy = "id",
        sortOrder = "desc",
      } = request.query;

      const serviceOptions: EditorialLookQueryOptions = {
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

      let looks;

      if (published === true) {
        looks =
          await this.editorialLookManagementService.getPublishedLooks(
            serviceOptions,
          );
      } else if (scheduled === true) {
        looks =
          await this.editorialLookManagementService.getScheduledLooks(
            serviceOptions,
          );
      } else if (draft === true) {
        looks =
          await this.editorialLookManagementService.getDraftLooks(
            serviceOptions,
          );
      } else if (hasContent === true) {
        looks =
          await this.editorialLookManagementService.getLooksWithContent(
            serviceOptions,
          );
      } else if (hasContent === false) {
        looks =
          await this.editorialLookManagementService.getLooksWithoutContent(
            serviceOptions,
          );
      } else {
        looks =
          await this.editorialLookManagementService.getAllEditorialLooks(
            serviceOptions,
          );
      }

      return reply.code(200).send({
        success: true,
        data: Array.isArray(looks)
          ? looks.map((look) => ({
              id: look.getId().getValue(),
              title: look.getTitle(),
              storyHtml: look.getStoryHtml(),
              heroAssetId: look.getHeroAssetId()?.getValue() || null,
              publishedAt: look.getPublishedAt(),
              productIds: look.getProductIds().map((id) => id.getValue()),
            }))
          : [],
        meta: {
          page: pageOptions.page,
          limit: pageOptions.limit,
          sortBy: pageOptions.sortBy,
          sortOrder: pageOptions.sortOrder,
        },
      });
    } catch (error) {
      request.log.error(error, "Failed to get editorial looks");
      return reply.code(500).send({
        success: false,
        error: "Internal server error",
        message: "Failed to retrieve editorial looks",
      });
    }
  }

  async getEditorialLook(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const { id } = request.params;

      if (!id || typeof id !== "string") {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: "Editorial look ID is required and must be a valid string",
        });
      }

      const look =
        await this.editorialLookManagementService.getEditorialLookById(id);

      return reply.code(200).send({
        success: true,
        data: {
          id: look.getId().getValue(),
          title: look.getTitle(),
          storyHtml: look.getStoryHtml(),
          heroAssetId: look.getHeroAssetId()?.getValue() || null,
          publishedAt: look.getPublishedAt(),
          productIds: look.getProductIds().map((id) => id.getValue()),
        },
      });
    } catch (error) {
      request.log.error(error, "Failed to get editorial look");

      if (error instanceof Error && error.message.includes("not found")) {
        return reply.code(404).send({
          success: false,
          error: "Not Found",
          message: "Editorial look not found",
        });
      }

      return reply.code(500).send({
        success: false,
        error: "Internal server error",
        message: "Failed to retrieve editorial look",
      });
    }
  }

  async createEditorialLook(
    request: FastifyRequest<{ Body: CreateEditorialLookRequest }>,
    reply: FastifyReply,
  ) {
    try {
      const lookData = request.body;

      // Basic validation
      if (
        !lookData.title ||
        typeof lookData.title !== "string" ||
        lookData.title.trim().length === 0
      ) {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: "Title is required and must be a non-empty string",
        });
      }

      // Validate title length
      if (lookData.title.length > 200) {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: "Title cannot be longer than 200 characters",
        });
      }

      // Validate HTML content length if provided
      if (lookData.storyHtml && lookData.storyHtml.length > 100000) {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: "Story content cannot exceed 100,000 characters",
        });
      }

      // Validate publishedAt if provided
      let publishedAt: Date | undefined;
      if (lookData.publishedAt) {
        publishedAt = new Date(lookData.publishedAt);
        if (isNaN(publishedAt.getTime())) {
          return reply.code(400).send({
            success: false,
            error: "Bad Request",
            message: "publishedAt must be a valid ISO date string",
          });
        }

        // Allow any publishedAt date (past, present, future)
      }

      // Validate productIds if provided
      if (lookData.productIds && !Array.isArray(lookData.productIds)) {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: "Product IDs must be an array",
        });
      }

      const createData: CreateEditorialLookData = {
        title: lookData.title,
        storyHtml: lookData.storyHtml,
        heroAssetId: lookData.heroAssetId,
        publishedAt,
        productIds: lookData.productIds,
      };

      const look =
        await this.editorialLookManagementService.createEditorialLook(
          createData,
        );

      return reply.code(201).send({
        success: true,
        data: {
          id: look.getId().getValue(),
          title: look.getTitle(),
          storyHtml: look.getStoryHtml(),
          heroAssetId: look.getHeroAssetId()?.getValue() || null,
          publishedAt: look.getPublishedAt(),
          productIds: look.getProductIds().map((id) => id.getValue()),
        },
        message: "Editorial look created successfully",
      });
    } catch (error) {
      request.log.error(error, "Failed to create editorial look");

      if (error instanceof Error && error.message.includes("already exists")) {
        return reply.code(409).send({
          success: false,
          error: "Conflict",
          message: "Editorial look with this title already exists",
        });
      }

      if (error instanceof Error && error.message.includes("not found")) {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: error.message,
        });
      }

      return reply.code(500).send({
        success: false,
        error: "Internal server error",
        message: "Failed to create editorial look",
      });
    }
  }

  async updateEditorialLook(
    request: FastifyRequest<{
      Params: { id: string };
      Body: UpdateEditorialLookRequest;
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
          message: "Editorial look ID is required and must be a valid string",
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

      // Validate HTML content if provided
      if (
        updateData.storyHtml !== undefined &&
        updateData.storyHtml &&
        updateData.storyHtml.length > 100000
      ) {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: "Story content cannot exceed 100,000 characters",
        });
      }

      // Validate publishedAt if provided
      let publishedAt: Date | null | undefined;
      if (updateData.publishedAt !== undefined) {
        if (updateData.publishedAt === null) {
          publishedAt = null;
        } else {
          publishedAt = new Date(updateData.publishedAt);
          if (isNaN(publishedAt.getTime())) {
            return reply.code(400).send({
              success: false,
              error: "Bad Request",
              message: "publishedAt must be a valid ISO date string or null",
            });
          }

          // Allow any publishedAt date (past, present, future)
        }
      }

      const updates = {
        title: updateData.title,
        storyHtml: updateData.storyHtml,
        heroAssetId: updateData.heroAssetId,
        publishedAt,
      };

      const look =
        await this.editorialLookManagementService.updateEditorialLook(
          id,
          updates,
        );

      return reply.code(200).send({
        success: true,
        data: {
          id: { value: look.getId().getValue() },
          title: look.getTitle(),
          storyHtml: look.getStoryHtml(),
          heroAssetId:
            look.getHeroAssetId() != null
              ? { value: look.getHeroAssetId()!.getValue() }
              : null,
          publishedAt: look.getPublishedAt(),
          productIds: look.getProductIds().map((id) => id.getValue()),
        },
        message: "Editorial look updated successfully",
      });
    } catch (error) {
      request.log.error(error, "Failed to update editorial look");

      if (error instanceof Error && error.message.includes("not found")) {
        return reply.code(404).send({
          success: false,
          error: "Not Found",
          message: "Editorial look not found",
        });
      }

      if (error instanceof Error && error.message.includes("already exists")) {
        return reply.code(409).send({
          success: false,
          error: "Conflict",
          message: "Editorial look with this title already exists",
        });
      }

      return reply.code(500).send({
        success: false,
        error: "Internal server error",
        message: "Failed to update editorial look",
      });
    }
  }

  async deleteEditorialLook(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const { id } = request.params;

      if (!id || typeof id !== "string") {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: "Editorial look ID is required and must be a valid string",
        });
      }

      await this.editorialLookManagementService.deleteEditorialLook(id);

      return reply.code(200).send({
        success: true,
        message: "Editorial look deleted successfully",
      });
    } catch (error) {
      request.log.error(error, "Failed to delete editorial look");

      if (error instanceof Error && error.message.includes("not found")) {
        return reply.code(404).send({
          success: false,
          error: "Not Found",
          message: "Editorial look not found",
        });
      }

      return reply.code(500).send({
        success: false,
        error: "Internal server error",
        message: "Failed to delete editorial look",
      });
    }
  }

  async publishEditorialLook(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const { id } = request.params;

      if (!id || typeof id !== "string") {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: "Editorial look ID is required and must be a valid string",
        });
      }

      const look = await this.editorialLookManagementService.publishLook(id);

      return reply.code(200).send({
        success: true,
        data: {
          id: { value: look.getId().getValue() },
          title: look.getTitle(),
          storyHtml: look.getStoryHtml(),
          heroAssetId:
            look.getHeroAssetId() != null
              ? { value: look.getHeroAssetId()!.getValue() }
              : null,
          publishedAt: look.getPublishedAt(),
          productIds: look.getProductIds().map((id) => id.getValue()),
        },
        message: "Editorial look published successfully",
      });
    } catch (error) {
      request.log.error(error, "Failed to publish editorial look");

      if (error instanceof Error && error.message.includes("not found")) {
        return reply.code(404).send({
          success: false,
          error: "Not Found",
          message: "Editorial look not found",
        });
      }

      if (
        error instanceof Error &&
        error.message.includes("cannot be published")
      ) {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: error.message,
        });
      }

      return reply.code(500).send({
        success: false,
        error: "Internal server error",
        message: "Failed to publish editorial look",
      });
    }
  }

  async unpublishEditorialLook(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const { id } = request.params;

      if (!id || typeof id !== "string") {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: "Editorial look ID is required and must be a valid string",
        });
      }

      const look = await this.editorialLookManagementService.unpublishLook(id);

      return reply.code(200).send({
        success: true,
        data: {
          id: { value: look.getId().getValue() },
          title: look.getTitle(),
          storyHtml: look.getStoryHtml(),
          heroAssetId:
            look.getHeroAssetId() != null
              ? { value: look.getHeroAssetId()!.getValue() }
              : null,
          publishedAt: look.getPublishedAt(),
          productIds: look.getProductIds().map((id) => id.getValue()),
        },
        message: "Editorial look unpublished successfully",
      });
    } catch (error) {
      request.log.error(error, "Failed to unpublish editorial look");

      if (error instanceof Error && error.message.includes("not found")) {
        return reply.code(404).send({
          success: false,
          error: "Not Found",
          message: "Editorial look not found",
        });
      }

      return reply.code(500).send({
        success: false,
        error: "Internal server error",
        message: "Failed to unpublish editorial look",
      });
    }
  }

  async schedulePublication(
    request: FastifyRequest<{
      Params: { id: string };
      Body: SchedulePublicationRequest;
    }>,
    reply: FastifyReply,
  ) {
    try {
      const { id } = request.params;
      const { publishDate } = request.body;

      if (!id || typeof id !== "string") {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: "Editorial look ID is required and must be a valid string",
        });
      }

      if (!publishDate || typeof publishDate !== "string") {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message:
            "Publish date is required and must be a valid ISO date string",
        });
      }

      const publishDateTime = new Date(publishDate);
      if (isNaN(publishDateTime.getTime())) {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: "Publish date must be a valid ISO date string",
        });
      }

      // Allow any publication date (past, present, future)

      const look =
        await this.editorialLookManagementService.scheduleLookPublication(
          id,
          publishDateTime,
        );

      return reply.code(200).send({
        success: true,
        data: {
          id: { value: look.getId().getValue() },
          title: look.getTitle(),
          storyHtml: look.getStoryHtml(),
          heroAssetId:
            look.getHeroAssetId() != null
              ? { value: look.getHeroAssetId()!.getValue() }
              : null,
          publishedAt: look.getPublishedAt(),
          productIds: look.getProductIds().map((id) => id.getValue()),
        },
        message: "Editorial look scheduled for publication successfully",
      });
    } catch (error) {
      request.log.error(error, "Failed to schedule editorial look publication");

      if (error instanceof Error && error.message.includes("not found")) {
        return reply.code(404).send({
          success: false,
          error: "Not Found",
          message: "Editorial look not found",
        });
      }

      if (
        error instanceof Error &&
        error.message.includes("cannot be scheduled")
      ) {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: error.message,
        });
      }

      return reply.code(500).send({
        success: false,
        error: "Internal server error",
        message: "Failed to schedule editorial look publication",
      });
    }
  }

  async getReadyToPublishLooks(request: FastifyRequest, reply: FastifyReply) {
    try {
      const looks =
        await this.editorialLookManagementService.getReadyToPublishLooks();

      return reply.code(200).send({
        success: true,
        data: looks.map((look) => ({
          id: look.getId().getValue(),
          title: look.getTitle(),
          storyHtml: look.getStoryHtml(),
          heroAssetId: look.getHeroAssetId()?.getValue() || null,
          publishedAt: look.getPublishedAt(),
          productIds: look.getProductIds().map((id) => id.getValue()),
        })),
      });
    } catch (error) {
      request.log.error(error, "Failed to get ready to publish looks");
      return reply.code(500).send({
        success: false,
        error: "Internal server error",
        message: "Failed to retrieve ready to publish looks",
      });
    }
  }

  async processScheduledPublications(
    request: FastifyRequest,
    reply: FastifyReply,
  ) {
    try {
      const result =
        await this.editorialLookManagementService.processScheduledPublications();

      return reply.code(200).send({
        success: true,
        data: {
          published: result.published.map((look) => ({
            id: { value: look.getId().getValue() },
            title: look.getTitle(),
            storyHtml: look.getStoryHtml(),
            heroAssetId:
              look.getHeroAssetId() != null
                ? { value: look.getHeroAssetId()!.getValue() }
                : null,
            publishedAt: look.getPublishedAt(),
            productIds: look.getProductIds().map((id) => id.getValue()),
          })),
          errors: result.errors,
        },
        message: `${result.published.length} editorial looks published successfully`,
      });
    } catch (error) {
      request.log.error(error, "Failed to process scheduled publications");
      return reply.code(500).send({
        success: false,
        error: "Internal server error",
        message: "Failed to process scheduled publications",
      });
    }
  }

  async setHeroImage(
    request: FastifyRequest<{
      Params: { id: string };
      Body: SetHeroImageRequest;
    }>,
    reply: FastifyReply,
  ) {
    try {
      const { id } = request.params;
      const { assetId } = request.body;

      if (!id || typeof id !== "string") {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: "Editorial look ID is required and must be a valid string",
        });
      }

      if (!assetId || typeof assetId !== "string") {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: "Asset ID is required and must be a valid string",
        });
      }

      const look = await this.editorialLookManagementService.setHeroImage(
        id,
        assetId,
      );

      return reply.code(200).send({
        success: true,
        data: {
          id: { value: look.getId().getValue() },
          title: look.getTitle(),
          storyHtml: look.getStoryHtml(),
          heroAssetId:
            look.getHeroAssetId() != null
              ? { value: look.getHeroAssetId()!.getValue() }
              : null,
          publishedAt: look.getPublishedAt(),
          productIds: look.getProductIds().map((id) => id.getValue()),
        },
        message: "Hero image set successfully",
      });
    } catch (error) {
      request.log.error(error, "Failed to set hero image");

      if (error instanceof Error && error.message.includes("not found")) {
        return reply.code(404).send({
          success: false,
          error: "Not Found",
          message: error.message,
        });
      }

      if (
        error instanceof Error &&
        error.message.includes("must be an image")
      ) {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: error.message,
        });
      }

      return reply.code(500).send({
        success: false,
        error: "Internal server error",
        message: "Failed to set hero image",
      });
    }
  }

  async removeHeroImage(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const { id } = request.params;

      if (!id || typeof id !== "string") {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: "Editorial look ID is required and must be a valid string",
        });
      }

      const look =
        await this.editorialLookManagementService.removeHeroImage(id);

      return reply.code(200).send({
        success: true,
        data: {
          id: { value: look.getId().getValue() },
          title: look.getTitle(),
          storyHtml: look.getStoryHtml(),
          heroAssetId:
            look.getHeroAssetId() != null
              ? { value: look.getHeroAssetId()!.getValue() }
              : null,
          publishedAt: look.getPublishedAt(),
          productIds: look.getProductIds().map((id) => id.getValue()),
        },
        message: "Hero image removed successfully",
      });
    } catch (error) {
      request.log.error(error, "Failed to remove hero image");

      if (error instanceof Error && error.message.includes("not found")) {
        return reply.code(404).send({
          success: false,
          error: "Not Found",
          message: "Editorial look not found",
        });
      }

      return reply.code(500).send({
        success: false,
        error: "Internal server error",
        message: "Failed to remove hero image",
      });
    }
  }

  async getLooksByHeroAsset(
    request: FastifyRequest<{ Params: { assetId: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const { assetId } = request.params;

      if (!assetId || typeof assetId !== "string") {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: "Asset ID is required and must be a valid string",
        });
      }

      console.log(
        `[DEBUG] Controller: searching for looks with heroAssetId: ${assetId}`,
      );

      const looks =
        await this.editorialLookManagementService.getLooksByHeroAsset(assetId);

      console.log(
        `[DEBUG] Controller: found ${looks.length} looks with heroAssetId: ${assetId}`,
      );

      return reply.code(200).send({
        success: true,
        data: looks.map((look) => ({
          id: look.getId().getValue(),
          title: look.getTitle(),
          storyHtml: look.getStoryHtml(),
          heroAssetId: look.getHeroAssetId()?.getValue() || null,
          publishedAt: look.getPublishedAt(),
          productIds: look.getProductIds().map((id) => id.getValue()),
        })),
      });
    } catch (error) {
      request.log.error(error, "Failed to get looks by hero asset");
      return reply.code(500).send({
        success: false,
        error: "Internal server error",
        message: "Failed to retrieve looks by hero asset",
      });
    }
  }

  async addProductToLook(
    request: FastifyRequest<{ Params: { id: string; productId: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const { id, productId } = request.params;

      if (!id || typeof id !== "string") {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: "Editorial look ID is required and must be a valid string",
        });
      }

      if (!productId || typeof productId !== "string") {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: "Product ID is required and must be a valid string",
        });
      }

      await this.editorialLookManagementService.addProductToLook(id, productId);

      return reply.code(200).send({
        success: true,
        message: "Product added to editorial look successfully",
      });
    } catch (error) {
      request.log.error(error, "Failed to add product to look");

      if (error instanceof Error && error.message.includes("not found")) {
        return reply.code(404).send({
          success: false,
          error: "Not Found",
          message: error.message,
        });
      }

      if (
        error instanceof Error &&
        error.message.includes("already associated")
      ) {
        return reply.code(409).send({
          success: false,
          error: "Conflict",
          message: error.message,
        });
      }

      return reply.code(500).send({
        success: false,
        error: "Internal server error",
        message: "Failed to add product to editorial look",
      });
    }
  }

  async removeProductFromLook(
    request: FastifyRequest<{ Params: { id: string; productId: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const { id, productId } = request.params;

      if (!id || typeof id !== "string") {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: "Editorial look ID is required and must be a valid string",
        });
      }

      if (!productId || typeof productId !== "string") {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: "Product ID is required and must be a valid string",
        });
      }

      await this.editorialLookManagementService.removeProductFromLook(
        id,
        productId,
      );

      return reply.code(200).send({
        success: true,
        message: "Product removed from editorial look successfully",
      });
    } catch (error) {
      request.log.error(error, "Failed to remove product from look");

      if (error instanceof Error && error.message.includes("not associated")) {
        return reply.code(404).send({
          success: false,
          error: "Not Found",
          message: error.message,
        });
      }

      return reply.code(500).send({
        success: false,
        error: "Internal server error",
        message: "Failed to remove product from editorial look",
      });
    }
  }

  async setLookProducts(
    request: FastifyRequest<{
      Params: { id: string };
      Body: SetLookProductsRequest;
    }>,
    reply: FastifyReply,
  ) {
    try {
      const { id } = request.params;
      const { productIds } = request.body;

      if (!id || typeof id !== "string") {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: "Editorial look ID is required and must be a valid string",
        });
      }

      if (!productIds || !Array.isArray(productIds)) {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: "Product IDs must be an array",
        });
      }

      const look = await this.editorialLookManagementService.setLookProducts(
        id,
        productIds,
      );

      return reply.code(200).send({
        success: true,
        data: {
          id: { value: look.getId().getValue() },
          title: look.getTitle(),
          storyHtml: look.getStoryHtml(),
          heroAssetId:
            look.getHeroAssetId() != null
              ? { value: look.getHeroAssetId()!.getValue() }
              : null,
          publishedAt: look.getPublishedAt(),
          productIds: look.getProductIds().map((id) => id.getValue()),
        },
        message: "Editorial look products updated successfully",
      });
    } catch (error) {
      request.log.error(error, "Failed to set look products");

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
        message: "Failed to set editorial look products",
      });
    }
  }

  async getLookProducts(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const { id } = request.params;

      if (!id || typeof id !== "string") {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: "Editorial look ID is required and must be a valid string",
        });
      }

      const productIds =
        await this.editorialLookManagementService.getLookProducts(id);

      return reply.code(200).send({
        success: true,
        data: productIds,
      });
    } catch (error) {
      request.log.error(error, "Failed to get look products");

      if (error instanceof Error && error.message.includes("not found")) {
        return reply.code(404).send({
          success: false,
          error: "Not Found",
          message: "Editorial look not found",
        });
      }

      return reply.code(500).send({
        success: false,
        error: "Internal server error",
        message: "Failed to get editorial look products",
      });
    }
  }

  async getProductLooks(
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

      const lookIds =
        await this.editorialLookManagementService.getProductLooks(productId);

      return reply.code(200).send({
        success: true,
        data: lookIds,
      });
    } catch (error) {
      request.log.error(error, "Failed to get product looks");

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
        message: "Failed to get product looks",
      });
    }
  }

  async getLooksByProduct(
    request: FastifyRequest<{
      Params: { productId: string };
      Querystring: EditorialLookQueryParams;
    }>,
    reply: FastifyReply,
  ) {
    try {
      const { productId } = request.params;
      const {
        page = 1,
        limit = 20,
        sortBy = "id",
        sortOrder = "desc",
        includeUnpublished = false,
      } = request.query;

      if (!productId || typeof productId !== "string") {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: "Product ID is required and must be a valid string",
        });
      }

      const serviceOptions: EditorialLookQueryOptions = {
        limit: Math.min(100, Math.max(1, limit)),
        offset: (Math.max(1, page) - 1) * Math.min(100, Math.max(1, limit)),
        sortBy,
        sortOrder,
        includeUnpublished,
      };

      const looks = await this.editorialLookManagementService.getLooksByProduct(
        productId,
        serviceOptions,
      );

      return reply.code(200).send({
        success: true,
        data: looks.map((look) => ({
          id: look.getId().getValue(),
          title: look.getTitle(),
          storyHtml: look.getStoryHtml(),
          heroAssetId: look.getHeroAssetId()?.getValue() || null,
          publishedAt: look.getPublishedAt(),
          productIds: look.getProductIds().map((id) => id.getValue()),
        })),
        meta: {
          productId,
          page: Math.max(1, page),
          limit: Math.min(100, Math.max(1, limit)),
          includeUnpublished,
        },
      });
    } catch (error) {
      request.log.error(error, "Failed to get looks by product");
      return reply.code(500).send({
        success: false,
        error: "Internal server error",
        message: "Failed to get looks by product",
      });
    }
  }

  async updateStoryContent(
    request: FastifyRequest<{
      Params: { id: string };
      Body: UpdateStoryContentRequest;
    }>,
    reply: FastifyReply,
  ) {
    try {
      const { id } = request.params;
      const { storyHtml } = request.body;

      if (!id || typeof id !== "string") {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: "Editorial look ID is required and must be a valid string",
        });
      }

      if (!storyHtml || typeof storyHtml !== "string") {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: "Story HTML content is required and must be a string",
        });
      }

      if (storyHtml.length > 100000) {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: "Story content cannot exceed 100,000 characters",
        });
      }

      const look = await this.editorialLookManagementService.updateStoryContent(
        id,
        storyHtml,
      );

      return reply.code(200).send({
        success: true,
        data: {
          id: { value: look.getId().getValue() },
          title: look.getTitle(),
          storyHtml: look.getStoryHtml(),
          heroAssetId:
            look.getHeroAssetId() != null
              ? { value: look.getHeroAssetId()!.getValue() }
              : null,
          publishedAt: look.getPublishedAt(),
          productIds: look.getProductIds().map((id) => id.getValue()),
        },
        message: "Story content updated successfully",
      });
    } catch (error) {
      request.log.error(error, "Failed to update story content");

      if (error instanceof Error && error.message.includes("not found")) {
        return reply.code(404).send({
          success: false,
          error: "Not Found",
          message: "Editorial look not found",
        });
      }

      return reply.code(500).send({
        success: false,
        error: "Internal server error",
        message: "Failed to update story content",
      });
    }
  }

  async clearStoryContent(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const { id } = request.params;

      if (!id || typeof id !== "string") {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: "Editorial look ID is required and must be a valid string",
        });
      }

      const look =
        await this.editorialLookManagementService.clearStoryContent(id);

      return reply.code(200).send({
        success: true,
        data: {
          id: { value: look.getId().getValue() },
          title: look.getTitle(),
          storyHtml: look.getStoryHtml(),
          heroAssetId:
            look.getHeroAssetId() != null
              ? { value: look.getHeroAssetId()!.getValue() }
              : null,
          publishedAt: look.getPublishedAt(),
          productIds: look.getProductIds().map((id) => id.getValue()),
        },
        message: "Story content cleared successfully",
      });
    } catch (error) {
      request.log.error(error, "Failed to clear story content");

      if (error instanceof Error && error.message.includes("not found")) {
        return reply.code(404).send({
          success: false,
          error: "Not Found",
          message: "Editorial look not found",
        });
      }

      return reply.code(500).send({
        success: false,
        error: "Internal server error",
        message: "Failed to clear story content",
      });
    }
  }

  async getEditorialLookStats(request: FastifyRequest, reply: FastifyReply) {
    try {
      const stats =
        await this.editorialLookManagementService.getEditorialLookStats();

      return reply.code(200).send({
        success: true,
        data: stats,
      });
    } catch (error) {
      request.log.error(error, "Failed to get editorial look statistics");
      return reply.code(500).send({
        success: false,
        error: "Internal server error",
        message: "Failed to retrieve editorial look statistics",
      });
    }
  }

  async getPopularProducts(
    request: FastifyRequest<{ Querystring: { limit?: number } }>,
    reply: FastifyReply,
  ) {
    try {
      const { limit = 10 } = request.query;

      const popularProducts =
        await this.editorialLookManagementService.getPopularProducts(
          Math.min(50, Math.max(1, limit)),
        );

      return reply.code(200).send({
        success: true,
        data: popularProducts,
      });
    } catch (error) {
      request.log.error(error, "Failed to get popular products");
      return reply.code(500).send({
        success: false,
        error: "Internal server error",
        message: "Failed to retrieve popular products",
      });
    }
  }

  async createBulkEditorialLooks(
    request: FastifyRequest<{ Body: BulkCreateEditorialLooksRequest }>,
    reply: FastifyReply,
  ) {
    try {
      const { looks } = request.body;

      if (!looks || !Array.isArray(looks) || looks.length === 0) {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: "Editorial looks array is required and must not be empty",
        });
      }

      if (looks.length > 20) {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: "Cannot create more than 20 editorial looks at once",
        });
      }

      // Validate each look
      for (const lookData of looks) {
        if (!lookData.title || typeof lookData.title !== "string") {
          return reply.code(400).send({
            success: false,
            error: "Bad Request",
            message: "All editorial looks must have a title",
          });
        }
      }

      const createData: CreateEditorialLookData[] = looks.map((look) => ({
        title: look.title,
        storyHtml: look.storyHtml,
        heroAssetId: look.heroAssetId,
        publishedAt: look.publishedAt ? new Date(look.publishedAt) : undefined,
        productIds: look.productIds,
      }));

      const createdLooks =
        await this.editorialLookManagementService.createMultipleEditorialLooks(
          createData,
        );

      return reply.code(201).send({
        success: true,
        data: createdLooks.map((look) => ({
          id: look.getId().getValue(),
          title: look.getTitle(),
          storyHtml: look.getStoryHtml(),
          heroAssetId: look.getHeroAssetId()?.getValue() || null,
          publishedAt: look.getPublishedAt(),
          productIds: look.getProductIds().map((id) => id.getValue()),
        })),
        message: `${createdLooks.length} editorial looks created successfully`,
      });
    } catch (error) {
      request.log.error(error, "Failed to create bulk editorial looks");
      return reply.code(500).send({
        success: false,
        error: "Internal server error",
        message: "Failed to create editorial looks",
      });
    }
  }

  async deleteBulkEditorialLooks(
    request: FastifyRequest<{ Body: BulkDeleteEditorialLooksRequest }>,
    reply: FastifyReply,
  ) {
    try {
      const { ids } = request.body;

      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: "Editorial look IDs array is required and must not be empty",
        });
      }

      if (ids.length > 50) {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: "Cannot delete more than 50 editorial looks at once",
        });
      }

      const result =
        await this.editorialLookManagementService.deleteMultipleEditorialLooks(
          ids,
        );

      return reply.code(200).send({
        success: true,
        data: result,
        message: `${result.deleted.length} editorial looks deleted successfully`,
      });
    } catch (error) {
      request.log.error(error, "Failed to delete bulk editorial looks");
      return reply.code(500).send({
        success: false,
        error: "Internal server error",
        message: "Failed to delete editorial looks",
      });
    }
  }

  async publishBulkEditorialLooks(
    request: FastifyRequest<{ Body: BulkPublishEditorialLooksRequest }>,
    reply: FastifyReply,
  ) {
    try {
      const { ids } = request.body;

      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: "Editorial look IDs array is required and must not be empty",
        });
      }

      if (ids.length > 20) {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: "Cannot publish more than 20 editorial looks at once",
        });
      }

      const result =
        await this.editorialLookManagementService.publishMultipleLooks(ids);

      return reply.code(200).send({
        success: true,
        data: result,
        message: `${result.published.length} editorial looks published successfully`,
      });
    } catch (error) {
      request.log.error(error, "Failed to publish bulk editorial looks");
      return reply.code(500).send({
        success: false,
        error: "Internal server error",
        message: "Failed to publish editorial looks",
      });
    }
  }

  async validateForPublication(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const { id } = request.params;

      if (!id || typeof id !== "string") {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: "Editorial look ID is required and must be a valid string",
        });
      }

      const validation =
        await this.editorialLookManagementService.validateLookForPublication(
          id,
        );

      return reply.code(200).send({
        success: true,
        data: validation,
      });
    } catch (error) {
      request.log.error(
        error,
        "Failed to validate editorial look for publication",
      );

      if (error instanceof Error && error.message.includes("not found")) {
        return reply.code(404).send({
          success: false,
          error: "Not Found",
          message: "Editorial look not found",
        });
      }

      return reply.code(500).send({
        success: false,
        error: "Internal server error",
        message: "Failed to validate editorial look for publication",
      });
    }
  }

  async duplicateEditorialLook(
    request: FastifyRequest<{
      Params: { id: string };
      Body: DuplicateEditorialLookRequest;
    }>,
    reply: FastifyReply,
  ) {
    try {
      const { id } = request.params;
      const { newTitle } = request.body;

      if (!id || typeof id !== "string") {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: "Editorial look ID is required and must be a valid string",
        });
      }

      if (
        !newTitle ||
        typeof newTitle !== "string" ||
        newTitle.trim().length === 0
      ) {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: "New title is required and must be a non-empty string",
        });
      }

      if (newTitle.length > 200) {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: "New title cannot be longer than 200 characters",
        });
      }

      const duplicatedLook =
        await this.editorialLookManagementService.duplicateEditorialLook(
          id,
          newTitle,
        );

      return reply.code(201).send({
        success: true,
        data: {
          id: duplicatedLook.getId().getValue(),
          title: duplicatedLook.getTitle(),
          storyHtml: duplicatedLook.getStoryHtml(),
          heroAssetId: duplicatedLook.getHeroAssetId()?.getValue() || null,
          publishedAt: duplicatedLook.getPublishedAt(),
          productIds: duplicatedLook.getProductIds().map((id) => id.getValue()),
        },
        message: "Editorial look duplicated successfully",
      });
    } catch (error) {
      request.log.error(error, "Failed to duplicate editorial look");

      if (error instanceof Error && error.message.includes("not found")) {
        return reply.code(404).send({
          success: false,
          error: "Not Found",
          message: "Editorial look not found",
        });
      }

      if (error instanceof Error && error.message.includes("already exists")) {
        return reply.code(409).send({
          success: false,
          error: "Conflict",
          message: "Editorial look with this title already exists",
        });
      }

      return reply.code(500).send({
        success: false,
        error: "Internal server error",
        message: "Failed to duplicate editorial look",
      });
    }
  }
}
