import { FastifyRequest, FastifyReply } from "fastify";
import { EditorialLookManagementService } from "../../../application/services/editorial-look-management.service";
import { CreateEditorialLookData } from "../../../domain/entities/editorial-look.entity";
import { EditorialLookQueryOptions } from "../../../domain/repositories/editorial-look.repository";
import { ResponseHelper } from "@/api/src/shared/response.helper";

export interface CreateEditorialLookRequest {
  title: string;
  storyHtml?: string;
  heroAssetId?: string;
  publishedAt?: string;
  productIds?: string[];
}

export interface UpdateEditorialLookRequest {
  title?: string;
  storyHtml?: string;
  heroAssetId?: string | null;
  publishedAt?: string | null;
}

export interface EditorialLookQueryParams {
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

export interface BulkCreateEditorialLooksRequest {
  looks: CreateEditorialLookRequest[];
}

export interface BulkDeleteEditorialLooksRequest {
  ids: string[];
}

export interface BulkPublishEditorialLooksRequest {
  ids: string[];
}

export interface SchedulePublicationRequest {
  publishDate: string;
}

export interface SetHeroImageRequest {
  assetId: string;
}

export interface UpdateStoryContentRequest {
  storyHtml: string;
}

export interface SetLookProductsRequest {
  productIds: string[];
}

export interface DuplicateEditorialLookRequest {
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

      return ResponseHelper.ok(reply, "Editorial looks retrieved successfully", {
        looks: Array.isArray(looks)
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
      return ResponseHelper.error(reply, error);
    }
  }

  async getEditorialLook(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const { id } = request.params;

      const look =
        await this.editorialLookManagementService.getEditorialLookById(id);

      return ResponseHelper.ok(reply, "Editorial look retrieved successfully", {
        id: look.getId().getValue(),
        title: look.getTitle(),
        storyHtml: look.getStoryHtml(),
        heroAssetId: look.getHeroAssetId()?.getValue() || null,
        publishedAt: look.getPublishedAt(),
        productIds: look.getProductIds().map((id) => id.getValue()),
      });
    } catch (error) {
      request.log.error(error, "Failed to get editorial look");

      if (error instanceof Error && error.message.includes("not found")) {
        return ResponseHelper.notFound(reply, "Editorial look not found");
      }

      return ResponseHelper.error(reply, error);
    }
  }

  async createEditorialLook(
    request: FastifyRequest<{ Body: CreateEditorialLookRequest }>,
    reply: FastifyReply,
  ) {
    try {
      const lookData = request.body;

      let publishedAt: Date | undefined;
      if (lookData.publishedAt) {
        publishedAt = new Date(lookData.publishedAt);
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

      return ResponseHelper.created(reply, "Editorial look created successfully", {
        id: look.getId().getValue(),
        title: look.getTitle(),
        storyHtml: look.getStoryHtml(),
        heroAssetId: look.getHeroAssetId()?.getValue() || null,
        publishedAt: look.getPublishedAt(),
        productIds: look.getProductIds().map((id) => id.getValue()),
      });
    } catch (error) {
      request.log.error(error, "Failed to create editorial look");

      if (error instanceof Error && error.message.includes("already exists")) {
        return reply.status(409).send({
          success: false,
          statusCode: 409,
          error: "Conflict",
          message: "Editorial look with this title already exists",
        });
      }

      if (error instanceof Error && error.message.includes("not found")) {
        return ResponseHelper.badRequest(reply, error.message);
      }

      return ResponseHelper.error(reply, error);
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

      let publishedAt: Date | null | undefined;
      if (updateData.publishedAt !== undefined) {
        if (updateData.publishedAt === null) {
          publishedAt = null;
        } else {
          publishedAt = new Date(updateData.publishedAt);
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

      return ResponseHelper.ok(reply, "Editorial look updated successfully", {
        id: { value: look.getId().getValue() },
        title: look.getTitle(),
        storyHtml: look.getStoryHtml(),
        heroAssetId:
          look.getHeroAssetId() != null
            ? { value: look.getHeroAssetId()!.getValue() }
            : null,
        publishedAt: look.getPublishedAt(),
        productIds: look.getProductIds().map((id) => id.getValue()),
      });
    } catch (error) {
      request.log.error(error, "Failed to update editorial look");

      if (error instanceof Error && error.message.includes("not found")) {
        return ResponseHelper.notFound(reply, "Editorial look not found");
      }

      if (error instanceof Error && error.message.includes("already exists")) {
        return reply.status(409).send({
          success: false,
          statusCode: 409,
          error: "Conflict",
          message: "Editorial look with this title already exists",
        });
      }

      return ResponseHelper.error(reply, error);
    }
  }

  async deleteEditorialLook(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const { id } = request.params;

      await this.editorialLookManagementService.deleteEditorialLook(id);

      return ResponseHelper.ok(reply, "Editorial look deleted successfully");
    } catch (error) {
      request.log.error(error, "Failed to delete editorial look");

      if (error instanceof Error && error.message.includes("not found")) {
        return ResponseHelper.notFound(reply, "Editorial look not found");
      }

      return ResponseHelper.error(reply, error);
    }
  }

  async publishEditorialLook(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const { id } = request.params;

      const look = await this.editorialLookManagementService.publishLook(id);

      return ResponseHelper.ok(reply, "Editorial look published successfully", {
        id: { value: look.getId().getValue() },
        title: look.getTitle(),
        storyHtml: look.getStoryHtml(),
        heroAssetId:
          look.getHeroAssetId() != null
            ? { value: look.getHeroAssetId()!.getValue() }
            : null,
        publishedAt: look.getPublishedAt(),
        productIds: look.getProductIds().map((id) => id.getValue()),
      });
    } catch (error) {
      request.log.error(error, "Failed to publish editorial look");

      if (error instanceof Error && error.message.includes("not found")) {
        return ResponseHelper.notFound(reply, "Editorial look not found");
      }

      if (
        error instanceof Error &&
        error.message.includes("cannot be published")
      ) {
        return ResponseHelper.badRequest(reply, error.message);
      }

      return ResponseHelper.error(reply, error);
    }
  }

  async unpublishEditorialLook(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const { id } = request.params;

      const look = await this.editorialLookManagementService.unpublishLook(id);

      return ResponseHelper.ok(reply, "Editorial look unpublished successfully", {
        id: { value: look.getId().getValue() },
        title: look.getTitle(),
        storyHtml: look.getStoryHtml(),
        heroAssetId:
          look.getHeroAssetId() != null
            ? { value: look.getHeroAssetId()!.getValue() }
            : null,
        publishedAt: look.getPublishedAt(),
        productIds: look.getProductIds().map((id) => id.getValue()),
      });
    } catch (error) {
      request.log.error(error, "Failed to unpublish editorial look");

      if (error instanceof Error && error.message.includes("not found")) {
        return ResponseHelper.notFound(reply, "Editorial look not found");
      }

      return ResponseHelper.error(reply, error);
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

      const publishDateTime = new Date(publishDate);

      // Allow any publication date (past, present, future)

      const look =
        await this.editorialLookManagementService.scheduleLookPublication(
          id,
          publishDateTime,
        );

      return ResponseHelper.ok(reply, "Editorial look scheduled for publication successfully", {
        id: { value: look.getId().getValue() },
        title: look.getTitle(),
        storyHtml: look.getStoryHtml(),
        heroAssetId:
          look.getHeroAssetId() != null
            ? { value: look.getHeroAssetId()!.getValue() }
            : null,
        publishedAt: look.getPublishedAt(),
        productIds: look.getProductIds().map((id) => id.getValue()),
      });
    } catch (error) {
      request.log.error(error, "Failed to schedule editorial look publication");

      if (error instanceof Error && error.message.includes("not found")) {
        return ResponseHelper.notFound(reply, "Editorial look not found");
      }

      if (
        error instanceof Error &&
        error.message.includes("cannot be scheduled")
      ) {
        return ResponseHelper.badRequest(reply, error.message);
      }

      return ResponseHelper.error(reply, error);
    }
  }

  async getReadyToPublishLooks(request: FastifyRequest, reply: FastifyReply) {
    try {
      const looks =
        await this.editorialLookManagementService.getReadyToPublishLooks();

      return ResponseHelper.ok(reply, "Ready to publish looks retrieved successfully", looks.map((look) => ({
        id: look.getId().getValue(),
        title: look.getTitle(),
        storyHtml: look.getStoryHtml(),
        heroAssetId: look.getHeroAssetId()?.getValue() || null,
        publishedAt: look.getPublishedAt(),
        productIds: look.getProductIds().map((id) => id.getValue()),
      })));
    } catch (error) {
      request.log.error(error, "Failed to get ready to publish looks");
      return ResponseHelper.error(reply, error);
    }
  }

  async processScheduledPublications(
    request: FastifyRequest,
    reply: FastifyReply,
  ) {
    try {
      const result =
        await this.editorialLookManagementService.processScheduledPublications();

      return ResponseHelper.ok(reply, `${result.published.length} editorial looks published successfully`, {
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
      });
    } catch (error) {
      request.log.error(error, "Failed to process scheduled publications");
      return ResponseHelper.error(reply, error);
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

      const look = await this.editorialLookManagementService.setHeroImage(
        id,
        assetId,
      );

      return ResponseHelper.ok(reply, "Hero image set successfully", {
        id: { value: look.getId().getValue() },
        title: look.getTitle(),
        storyHtml: look.getStoryHtml(),
        heroAssetId:
          look.getHeroAssetId() != null
            ? { value: look.getHeroAssetId()!.getValue() }
            : null,
        publishedAt: look.getPublishedAt(),
        productIds: look.getProductIds().map((id) => id.getValue()),
      });
    } catch (error) {
      request.log.error(error, "Failed to set hero image");

      if (error instanceof Error && error.message.includes("not found")) {
        return ResponseHelper.notFound(reply, error.message);
      }

      if (
        error instanceof Error &&
        error.message.includes("must be an image")
      ) {
        return ResponseHelper.badRequest(reply, error.message);
      }

      return ResponseHelper.error(reply, error);
    }
  }

  async removeHeroImage(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const { id } = request.params;

      const look =
        await this.editorialLookManagementService.removeHeroImage(id);

      return ResponseHelper.ok(reply, "Hero image removed successfully", {
        id: { value: look.getId().getValue() },
        title: look.getTitle(),
        storyHtml: look.getStoryHtml(),
        heroAssetId:
          look.getHeroAssetId() != null
            ? { value: look.getHeroAssetId()!.getValue() }
            : null,
        publishedAt: look.getPublishedAt(),
        productIds: look.getProductIds().map((id) => id.getValue()),
      });
    } catch (error) {
      request.log.error(error, "Failed to remove hero image");

      if (error instanceof Error && error.message.includes("not found")) {
        return ResponseHelper.notFound(reply, "Editorial look not found");
      }

      return ResponseHelper.error(reply, error);
    }
  }

  async getLooksByHeroAsset(
    request: FastifyRequest<{ Params: { assetId: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const { assetId } = request.params;

      const looks =
        await this.editorialLookManagementService.getLooksByHeroAsset(assetId);

      return ResponseHelper.ok(reply, "Looks by hero asset retrieved successfully", looks.map((look) => ({
        id: look.getId().getValue(),
        title: look.getTitle(),
        storyHtml: look.getStoryHtml(),
        heroAssetId: look.getHeroAssetId()?.getValue() || null,
        publishedAt: look.getPublishedAt(),
        productIds: look.getProductIds().map((id) => id.getValue()),
      })));
    } catch (error) {
      request.log.error(error, "Failed to get looks by hero asset");
      return ResponseHelper.error(reply, error);
    }
  }

  async addProductToLook(
    request: FastifyRequest<{ Params: { id: string; productId: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const { id, productId } = request.params;

      await this.editorialLookManagementService.addProductToLook(id, productId);

      return ResponseHelper.ok(reply, "Product added to editorial look successfully");
    } catch (error) {
      request.log.error(error, "Failed to add product to look");

      if (error instanceof Error && error.message.includes("not found")) {
        return ResponseHelper.notFound(reply, error.message);
      }

      if (
        error instanceof Error &&
        error.message.includes("already associated")
      ) {
        return reply.status(409).send({
          success: false,
          statusCode: 409,
          error: "Conflict",
          message: error.message,
        });
      }

      return ResponseHelper.error(reply, error);
    }
  }

  async removeProductFromLook(
    request: FastifyRequest<{ Params: { id: string; productId: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const { id, productId } = request.params;

      await this.editorialLookManagementService.removeProductFromLook(
        id,
        productId,
      );

      return ResponseHelper.ok(reply, "Product removed from editorial look successfully");
    } catch (error) {
      request.log.error(error, "Failed to remove product from look");

      if (error instanceof Error && error.message.includes("not associated")) {
        return ResponseHelper.notFound(reply, error.message);
      }

      return ResponseHelper.error(reply, error);
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

      const look = await this.editorialLookManagementService.setLookProducts(
        id,
        productIds,
      );

      return ResponseHelper.ok(reply, "Editorial look products updated successfully", {
        id: { value: look.getId().getValue() },
        title: look.getTitle(),
        storyHtml: look.getStoryHtml(),
        heroAssetId:
          look.getHeroAssetId() != null
            ? { value: look.getHeroAssetId()!.getValue() }
            : null,
        publishedAt: look.getPublishedAt(),
        productIds: look.getProductIds().map((id) => id.getValue()),
      });
    } catch (error) {
      request.log.error(error, "Failed to set look products");

      if (error instanceof Error && error.message.includes("not found")) {
        return ResponseHelper.notFound(reply, error.message);
      }

      return ResponseHelper.error(reply, error);
    }
  }

  async getLookProducts(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const { id } = request.params;

      const productIds =
        await this.editorialLookManagementService.getLookProducts(id);

      return ResponseHelper.ok(reply, "Editorial look products retrieved successfully", productIds);
    } catch (error) {
      request.log.error(error, "Failed to get look products");

      if (error instanceof Error && error.message.includes("not found")) {
        return ResponseHelper.notFound(reply, "Editorial look not found");
      }

      return ResponseHelper.error(reply, error);
    }
  }

  async getProductLooks(
    request: FastifyRequest<{ Params: { productId: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const { productId } = request.params;

      const lookIds =
        await this.editorialLookManagementService.getProductLooks(productId);

      return ResponseHelper.ok(reply, "Product looks retrieved successfully", lookIds);
    } catch (error) {
      request.log.error(error, "Failed to get product looks");

      if (error instanceof Error && error.message.includes("not found")) {
        return ResponseHelper.notFound(reply, "Product not found");
      }

      return ResponseHelper.error(reply, error);
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

      return ResponseHelper.ok(reply, "Looks by product retrieved successfully", {
        looks: looks.map((look) => ({
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
      return ResponseHelper.error(reply, error);
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

      const look = await this.editorialLookManagementService.updateStoryContent(
        id,
        storyHtml,
      );

      return ResponseHelper.ok(reply, "Story content updated successfully", {
        id: { value: look.getId().getValue() },
        title: look.getTitle(),
        storyHtml: look.getStoryHtml(),
        heroAssetId:
          look.getHeroAssetId() != null
            ? { value: look.getHeroAssetId()!.getValue() }
            : null,
        publishedAt: look.getPublishedAt(),
        productIds: look.getProductIds().map((id) => id.getValue()),
      });
    } catch (error) {
      request.log.error(error, "Failed to update story content");

      if (error instanceof Error && error.message.includes("not found")) {
        return ResponseHelper.notFound(reply, "Editorial look not found");
      }

      return ResponseHelper.error(reply, error);
    }
  }

  async clearStoryContent(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const { id } = request.params;

      const look =
        await this.editorialLookManagementService.clearStoryContent(id);

      return ResponseHelper.ok(reply, "Story content cleared successfully", {
        id: { value: look.getId().getValue() },
        title: look.getTitle(),
        storyHtml: look.getStoryHtml(),
        heroAssetId:
          look.getHeroAssetId() != null
            ? { value: look.getHeroAssetId()!.getValue() }
            : null,
        publishedAt: look.getPublishedAt(),
        productIds: look.getProductIds().map((id) => id.getValue()),
      });
    } catch (error) {
      request.log.error(error, "Failed to clear story content");

      if (error instanceof Error && error.message.includes("not found")) {
        return ResponseHelper.notFound(reply, "Editorial look not found");
      }

      return ResponseHelper.error(reply, error);
    }
  }

  async getEditorialLookStats(request: FastifyRequest, reply: FastifyReply) {
    try {
      const stats =
        await this.editorialLookManagementService.getEditorialLookStats();

      return ResponseHelper.ok(reply, "Editorial look statistics retrieved successfully", stats);
    } catch (error) {
      request.log.error(error, "Failed to get editorial look statistics");
      return ResponseHelper.error(reply, error);
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

      return ResponseHelper.ok(reply, "Popular products retrieved successfully", popularProducts);
    } catch (error) {
      request.log.error(error, "Failed to get popular products");
      return ResponseHelper.error(reply, error);
    }
  }

  async createBulkEditorialLooks(
    request: FastifyRequest<{ Body: BulkCreateEditorialLooksRequest }>,
    reply: FastifyReply,
  ) {
    try {
      const { looks } = request.body;

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

      return ResponseHelper.created(
        reply,
        `${createdLooks.length} editorial looks created successfully`,
        createdLooks.map((look) => ({
          id: look.getId().getValue(),
          title: look.getTitle(),
          storyHtml: look.getStoryHtml(),
          heroAssetId: look.getHeroAssetId()?.getValue() || null,
          publishedAt: look.getPublishedAt(),
          productIds: look.getProductIds().map((id) => id.getValue()),
        })),
      );
    } catch (error) {
      request.log.error(error, "Failed to create bulk editorial looks");
      return ResponseHelper.error(reply, error);
    }
  }

  async deleteBulkEditorialLooks(
    request: FastifyRequest<{ Body: BulkDeleteEditorialLooksRequest }>,
    reply: FastifyReply,
  ) {
    try {
      const { ids } = request.body;

      const result =
        await this.editorialLookManagementService.deleteMultipleEditorialLooks(
          ids,
        );

      return ResponseHelper.ok(
        reply,
        `${result.deleted.length} editorial looks deleted successfully`,
        result,
      );
    } catch (error) {
      request.log.error(error, "Failed to delete bulk editorial looks");
      return ResponseHelper.error(reply, error);
    }
  }

  async publishBulkEditorialLooks(
    request: FastifyRequest<{ Body: BulkPublishEditorialLooksRequest }>,
    reply: FastifyReply,
  ) {
    try {
      const { ids } = request.body;

      const result =
        await this.editorialLookManagementService.publishMultipleLooks(ids);

      return ResponseHelper.ok(
        reply,
        `${result.published.length} editorial looks published successfully`,
        result,
      );
    } catch (error) {
      request.log.error(error, "Failed to publish bulk editorial looks");
      return ResponseHelper.error(reply, error);
    }
  }

  async validateForPublication(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const { id } = request.params;

      const validation =
        await this.editorialLookManagementService.validateLookForPublication(
          id,
        );

      return ResponseHelper.ok(reply, "Editorial look validated for publication", validation);
    } catch (error) {
      request.log.error(
        error,
        "Failed to validate editorial look for publication",
      );

      if (error instanceof Error && error.message.includes("not found")) {
        return ResponseHelper.notFound(reply, "Editorial look not found");
      }

      return ResponseHelper.error(reply, error);
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

      const duplicatedLook =
        await this.editorialLookManagementService.duplicateEditorialLook(
          id,
          newTitle,
        );

      return ResponseHelper.created(reply, "Editorial look duplicated successfully", {
        id: duplicatedLook.getId().getValue(),
        title: duplicatedLook.getTitle(),
        storyHtml: duplicatedLook.getStoryHtml(),
        heroAssetId: duplicatedLook.getHeroAssetId()?.getValue() || null,
        publishedAt: duplicatedLook.getPublishedAt(),
        productIds: duplicatedLook.getProductIds().map((id) => id.getValue()),
      });
    } catch (error) {
      request.log.error(error, "Failed to duplicate editorial look");

      if (error instanceof Error && error.message.includes("not found")) {
        return ResponseHelper.notFound(reply, "Editorial look not found");
      }

      if (error instanceof Error && error.message.includes("already exists")) {
        return reply.status(409).send({
          success: false,
          statusCode: 409,
          error: "Conflict",
          message: "Editorial look with this title already exists",
        });
      }

      return ResponseHelper.error(reply, error);
    }
  }
}
