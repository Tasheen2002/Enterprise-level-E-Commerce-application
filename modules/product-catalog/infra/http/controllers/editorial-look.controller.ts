import { FastifyRequest, FastifyReply } from "fastify";
import { EditorialLookManagementService } from "../../../application/services/editorial-look-management.service";
import { CreateEditorialLookData } from "../../../domain/entities/editorial-look.entity";
import { EditorialLookQueryOptions } from "../../../domain/repositories/editorial-look.repository";
import { ResponseHelper } from "@/api/src/shared/response.helper";
import { EditorialLookDTO } from "../../../domain/entities/editorial-look.entity";

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

function toLookResponse(look: EditorialLookDTO) {
  return {
    id: look.id,
    title: look.title,
    storyHtml: look.storyHtml,
    heroAssetId: look.heroAssetId,
    publishedAt: look.publishedAt,
    productIds: look.productIds,
  };
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

      let looks: EditorialLookDTO[];

      if (published === true) {
        looks = await this.editorialLookManagementService.getPublishedLooks(serviceOptions);
      } else if (scheduled === true) {
        looks = await this.editorialLookManagementService.getScheduledLooks(serviceOptions);
      } else if (draft === true) {
        looks = await this.editorialLookManagementService.getDraftLooks(serviceOptions);
      } else if (hasContent === true) {
        looks = await this.editorialLookManagementService.getLooksWithContent(serviceOptions);
      } else if (hasContent === false) {
        looks = await this.editorialLookManagementService.getLooksWithoutContent(serviceOptions);
      } else {
        looks = await this.editorialLookManagementService.getAllEditorialLooks(serviceOptions);
      }

      return ResponseHelper.ok(reply, "Editorial looks retrieved successfully", {
        looks: looks.map(toLookResponse),
        meta: pageOptions,
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
      const look = await this.editorialLookManagementService.getEditorialLookById(request.params.id);
      return ResponseHelper.ok(reply, "Editorial look retrieved successfully", toLookResponse(look));
    } catch (error) {
      request.log.error(error, "Failed to get editorial look");
      return ResponseHelper.error(reply, error);
    }
  }

  async createEditorialLook(
    request: FastifyRequest<{ Body: CreateEditorialLookRequest }>,
    reply: FastifyReply,
  ) {
    try {
      const lookData = request.body;
      const createData: CreateEditorialLookData = {
        title: lookData.title,
        storyHtml: lookData.storyHtml,
        heroAssetId: lookData.heroAssetId,
        publishedAt: lookData.publishedAt ? new Date(lookData.publishedAt) : undefined,
        productIds: lookData.productIds,
      };
      const look = await this.editorialLookManagementService.createEditorialLook(createData);
      return ResponseHelper.created(reply, "Editorial look created successfully", toLookResponse(look));
    } catch (error) {
      request.log.error(error, "Failed to create editorial look");
      return ResponseHelper.error(reply, error);
    }
  }

  async updateEditorialLook(
    request: FastifyRequest<{ Params: { id: string }; Body: UpdateEditorialLookRequest }>,
    reply: FastifyReply,
  ) {
    try {
      const { id } = request.params;
      const updateData = request.body;
      let publishedAt: Date | null | undefined;
      if (updateData.publishedAt !== undefined) {
        publishedAt = updateData.publishedAt === null ? null : new Date(updateData.publishedAt);
      }
      const look = await this.editorialLookManagementService.updateEditorialLook(id, {
        title: updateData.title,
        storyHtml: updateData.storyHtml,
        heroAssetId: updateData.heroAssetId,
        publishedAt,
      });
      return ResponseHelper.ok(reply, "Editorial look updated successfully", toLookResponse(look));
    } catch (error) {
      request.log.error(error, "Failed to update editorial look");
      return ResponseHelper.error(reply, error);
    }
  }

  async deleteEditorialLook(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ) {
    try {
      await this.editorialLookManagementService.deleteEditorialLook(request.params.id);
      return ResponseHelper.ok(reply, "Editorial look deleted successfully");
    } catch (error) {
      request.log.error(error, "Failed to delete editorial look");
      return ResponseHelper.error(reply, error);
    }
  }

  async publishEditorialLook(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const look = await this.editorialLookManagementService.publishLook(request.params.id);
      return ResponseHelper.ok(reply, "Editorial look published successfully", toLookResponse(look));
    } catch (error) {
      request.log.error(error, "Failed to publish editorial look");
      return ResponseHelper.error(reply, error);
    }
  }

  async unpublishEditorialLook(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const look = await this.editorialLookManagementService.unpublishLook(request.params.id);
      return ResponseHelper.ok(reply, "Editorial look unpublished successfully", toLookResponse(look));
    } catch (error) {
      request.log.error(error, "Failed to unpublish editorial look");
      return ResponseHelper.error(reply, error);
    }
  }

  async schedulePublication(
    request: FastifyRequest<{ Params: { id: string }; Body: SchedulePublicationRequest }>,
    reply: FastifyReply,
  ) {
    try {
      const look = await this.editorialLookManagementService.scheduleLookPublication(
        request.params.id,
        new Date(request.body.publishDate),
      );
      return ResponseHelper.ok(reply, "Editorial look scheduled for publication successfully", toLookResponse(look));
    } catch (error) {
      request.log.error(error, "Failed to schedule editorial look publication");
      return ResponseHelper.error(reply, error);
    }
  }

  async getReadyToPublishLooks(request: FastifyRequest, reply: FastifyReply) {
    try {
      const looks = await this.editorialLookManagementService.getReadyToPublishLooks();
      return ResponseHelper.ok(reply, "Ready to publish looks retrieved successfully", looks.map(toLookResponse));
    } catch (error) {
      request.log.error(error, "Failed to get ready to publish looks");
      return ResponseHelper.error(reply, error);
    }
  }

  async processScheduledPublications(request: FastifyRequest, reply: FastifyReply) {
    try {
      const result = await this.editorialLookManagementService.processScheduledPublications();
      return ResponseHelper.ok(reply, `${result.published.length} editorial looks published successfully`, {
        published: result.published.map(toLookResponse),
        errors: result.errors,
      });
    } catch (error) {
      request.log.error(error, "Failed to process scheduled publications");
      return ResponseHelper.error(reply, error);
    }
  }

  async setHeroImage(
    request: FastifyRequest<{ Params: { id: string }; Body: SetHeroImageRequest }>,
    reply: FastifyReply,
  ) {
    try {
      const look = await this.editorialLookManagementService.setHeroImage(request.params.id, request.body.assetId);
      return ResponseHelper.ok(reply, "Hero image set successfully", toLookResponse(look));
    } catch (error) {
      request.log.error(error, "Failed to set hero image");
      return ResponseHelper.error(reply, error);
    }
  }

  async removeHeroImage(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const look = await this.editorialLookManagementService.removeHeroImage(request.params.id);
      return ResponseHelper.ok(reply, "Hero image removed successfully", toLookResponse(look));
    } catch (error) {
      request.log.error(error, "Failed to remove hero image");
      return ResponseHelper.error(reply, error);
    }
  }

  async getLooksByHeroAsset(
    request: FastifyRequest<{ Params: { assetId: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const looks = await this.editorialLookManagementService.getLooksByHeroAsset(request.params.assetId);
      return ResponseHelper.ok(reply, "Looks by hero asset retrieved successfully", looks.map(toLookResponse));
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
      await this.editorialLookManagementService.addProductToLook(request.params.id, request.params.productId);
      return ResponseHelper.ok(reply, "Product added to editorial look successfully");
    } catch (error) {
      request.log.error(error, "Failed to add product to look");
      return ResponseHelper.error(reply, error);
    }
  }

  async removeProductFromLook(
    request: FastifyRequest<{ Params: { id: string; productId: string } }>,
    reply: FastifyReply,
  ) {
    try {
      await this.editorialLookManagementService.removeProductFromLook(request.params.id, request.params.productId);
      return ResponseHelper.ok(reply, "Product removed from editorial look successfully");
    } catch (error) {
      request.log.error(error, "Failed to remove product from look");
      return ResponseHelper.error(reply, error);
    }
  }

  async setLookProducts(
    request: FastifyRequest<{ Params: { id: string }; Body: SetLookProductsRequest }>,
    reply: FastifyReply,
  ) {
    try {
      const look = await this.editorialLookManagementService.setLookProducts(request.params.id, request.body.productIds);
      return ResponseHelper.ok(reply, "Editorial look products updated successfully", toLookResponse(look));
    } catch (error) {
      request.log.error(error, "Failed to set look products");
      return ResponseHelper.error(reply, error);
    }
  }

  async getLookProducts(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const productIds = await this.editorialLookManagementService.getLookProducts(request.params.id);
      return ResponseHelper.ok(reply, "Editorial look products retrieved successfully", productIds);
    } catch (error) {
      request.log.error(error, "Failed to get look products");
      return ResponseHelper.error(reply, error);
    }
  }

  async getProductLooks(
    request: FastifyRequest<{ Params: { productId: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const lookIds = await this.editorialLookManagementService.getProductLooks(request.params.productId);
      return ResponseHelper.ok(reply, "Product looks retrieved successfully", lookIds);
    } catch (error) {
      request.log.error(error, "Failed to get product looks");
      return ResponseHelper.error(reply, error);
    }
  }

  async getLooksByProduct(
    request: FastifyRequest<{ Params: { productId: string }; Querystring: EditorialLookQueryParams }>,
    reply: FastifyReply,
  ) {
    try {
      const { productId } = request.params;
      const { page = 1, limit = 20, sortBy = "id", sortOrder = "desc", includeUnpublished = false } = request.query;
      const serviceOptions: EditorialLookQueryOptions = {
        limit: Math.min(100, Math.max(1, limit)),
        offset: (Math.max(1, page) - 1) * Math.min(100, Math.max(1, limit)),
        sortBy, sortOrder, includeUnpublished,
      };
      const looks = await this.editorialLookManagementService.getLooksByProduct(productId, serviceOptions);
      return ResponseHelper.ok(reply, "Looks by product retrieved successfully", {
        looks: looks.map(toLookResponse),
        meta: { productId, page: Math.max(1, page), limit: Math.min(100, Math.max(1, limit)), includeUnpublished },
      });
    } catch (error) {
      request.log.error(error, "Failed to get looks by product");
      return ResponseHelper.error(reply, error);
    }
  }

  async updateStoryContent(
    request: FastifyRequest<{ Params: { id: string }; Body: UpdateStoryContentRequest }>,
    reply: FastifyReply,
  ) {
    try {
      const look = await this.editorialLookManagementService.updateStoryContent(request.params.id, request.body.storyHtml);
      return ResponseHelper.ok(reply, "Story content updated successfully", toLookResponse(look));
    } catch (error) {
      request.log.error(error, "Failed to update story content");
      return ResponseHelper.error(reply, error);
    }
  }

  async clearStoryContent(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const look = await this.editorialLookManagementService.clearStoryContent(request.params.id);
      return ResponseHelper.ok(reply, "Story content cleared successfully", toLookResponse(look));
    } catch (error) {
      request.log.error(error, "Failed to clear story content");
      return ResponseHelper.error(reply, error);
    }
  }

  async getEditorialLookStats(request: FastifyRequest, reply: FastifyReply) {
    try {
      const stats = await this.editorialLookManagementService.getEditorialLookStats();
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
      const popularProducts = await this.editorialLookManagementService.getPopularProducts(
        Math.min(50, Math.max(1, request.query.limit ?? 10)),
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
      const createData: CreateEditorialLookData[] = request.body.looks.map((look) => ({
        title: look.title,
        storyHtml: look.storyHtml,
        heroAssetId: look.heroAssetId,
        publishedAt: look.publishedAt ? new Date(look.publishedAt) : undefined,
        productIds: look.productIds,
      }));
      const createdLooks = await this.editorialLookManagementService.createMultipleEditorialLooks(createData);
      return ResponseHelper.created(reply, `${createdLooks.length} editorial looks created successfully`, createdLooks.map(toLookResponse));
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
      const result = await this.editorialLookManagementService.deleteMultipleEditorialLooks(request.body.ids);
      return ResponseHelper.ok(reply, `${result.deleted.length} editorial looks deleted successfully`, result);
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
      const result = await this.editorialLookManagementService.publishMultipleLooks(request.body.ids);
      return ResponseHelper.ok(reply, `${result.published.length} editorial looks published successfully`, result);
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
      const validation = await this.editorialLookManagementService.validateLookForPublication(request.params.id);
      return ResponseHelper.ok(reply, "Editorial look validated for publication", validation);
    } catch (error) {
      request.log.error(error, "Failed to validate editorial look for publication");
      return ResponseHelper.error(reply, error);
    }
  }

  async duplicateEditorialLook(
    request: FastifyRequest<{ Params: { id: string }; Body: DuplicateEditorialLookRequest }>,
    reply: FastifyReply,
  ) {
    try {
      const look = await this.editorialLookManagementService.duplicateEditorialLook(request.params.id, request.body.newTitle);
      return ResponseHelper.created(reply, "Editorial look duplicated successfully", toLookResponse(look));
    } catch (error) {
      request.log.error(error, "Failed to duplicate editorial look");
      return ResponseHelper.error(reply, error);
    }
  }
}
