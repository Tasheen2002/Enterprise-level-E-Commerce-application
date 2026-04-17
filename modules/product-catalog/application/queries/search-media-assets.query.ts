import { IQuery, IQueryHandler } from "../../../../packages/core/src/application/cqrs";
import { MediaAssetDTO } from "../../domain/entities/media-asset.entity";
import { MediaManagementService } from "../services/media-management.service";
import { MediaAssetFilters } from "../../domain/repositories/media-asset.repository";

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

export interface SearchMediaAssetsResult {
  readonly assets: MediaAssetDTO[];
  readonly meta: {
    readonly page: number;
    readonly limit: number;
    readonly sortBy: string;
    readonly sortOrder: string;
    readonly filters: MediaAssetFilters;
  };
}

export class SearchMediaAssetsHandler implements IQueryHandler<SearchMediaAssetsQuery, SearchMediaAssetsResult> {
  constructor(private readonly mediaManagementService: MediaManagementService) {}

  async handle(query: SearchMediaAssetsQuery): Promise<SearchMediaAssetsResult> {
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(100, Math.max(1, query.limit ?? 20));
    const sortBy = query.sortBy ?? "createdAt";
    const sortOrder = query.sortOrder ?? "desc";

    const filters: MediaAssetFilters = {
      mimeType: query.mimeType,
      isImage: query.isImage,
      isVideo: query.isVideo,
      hasRenditions: query.hasRenditions,
      minBytes: query.minBytes,
      maxBytes: query.maxBytes,
    };

    const options = { page, limit, sortBy, sortOrder, hasRenditions: query.hasRenditions };

    const assets = await this.mediaManagementService.searchAssets(filters, options);

    return { assets, meta: { page, limit, sortBy, sortOrder, filters } };
  }
}
