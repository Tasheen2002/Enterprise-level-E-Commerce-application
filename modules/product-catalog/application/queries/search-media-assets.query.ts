import { IQuery, IQueryHandler } from "../../../../packages/core/src/application/cqrs";
import { MediaAssetDTO } from "../../domain/entities/media-asset.entity";
import { MediaManagementService } from "../services/media-management.service";
import { MediaAssetFilters } from "../../domain/repositories/media-asset.repository";
import { PaginatedResult } from "../../../../packages/core/src/domain/interfaces/paginated-result.interface";
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE, MIN_LIMIT, MIN_PAGE } from "../../domain/constants/pagination.constants";

export interface SearchMediaAssetsQuery extends IQuery {
  readonly page?: number;
  readonly limit?: number;
  readonly mimeType?: string;
  readonly isImage?: boolean;
  readonly isVideo?: boolean;
  readonly hasRenditions?: boolean;
  readonly sortBy?: "createdAt" | "bytes" | "width" | "height" | "version";
  readonly sortOrder?: "asc" | "desc";
  readonly minBytes?: number;
  readonly maxBytes?: number;
  readonly minWidth?: number;
  readonly maxWidth?: number;
  readonly minHeight?: number;
  readonly maxHeight?: number;
}

export class SearchMediaAssetsHandler implements IQueryHandler<SearchMediaAssetsQuery, PaginatedResult<MediaAssetDTO>> {
  constructor(private readonly mediaManagementService: MediaManagementService) {}

  async handle(query: SearchMediaAssetsQuery): Promise<PaginatedResult<MediaAssetDTO>> {
    const filters: MediaAssetFilters = {
      mimeType: query.mimeType,
      isImage: query.isImage,
      isVideo: query.isVideo,
      hasRenditions: query.hasRenditions,
      minBytes: query.minBytes,
      maxBytes: query.maxBytes,
    };

    return this.mediaManagementService.searchAssets(filters, {
      page: Math.max(MIN_PAGE, query.page ?? MIN_PAGE),
      limit: Math.min(MAX_PAGE_SIZE, Math.max(MIN_LIMIT, query.limit ?? DEFAULT_PAGE_SIZE)),
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    });
  }
}
