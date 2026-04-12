import { IQuery, IQueryHandler } from "../../../../packages/core/src/application/cqrs";
import { EditorialLookDTO } from "../../domain/entities/editorial-look.entity";
import { EditorialLookManagementService } from "../services/editorial-look-management.service";
import { EditorialLookQueryOptions } from "../../domain/repositories/editorial-look.repository";

export interface ListEditorialLooksQuery extends IQuery {
  page?: number;
  limit?: number;
  published?: boolean;
  scheduled?: boolean;
  draft?: boolean;
  hasContent?: boolean;
  sortBy?: "title" | "publishedAt" | "id";
  sortOrder?: "asc" | "desc";
}

export interface ListEditorialLooksResult {
  looks: EditorialLookDTO[];
  meta: {
    page: number;
    limit: number;
    sortBy: string;
    sortOrder: string;
  };
}

export class ListEditorialLooksHandler implements IQueryHandler<ListEditorialLooksQuery, ListEditorialLooksResult> {
  constructor(private readonly editorialLookManagementService: EditorialLookManagementService) {}

  async handle(query: ListEditorialLooksQuery): Promise<ListEditorialLooksResult> {
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(100, Math.max(1, query.limit ?? 20));
    const sortBy = query.sortBy ?? "id";
    const sortOrder = query.sortOrder ?? "desc";

    const serviceOptions: EditorialLookQueryOptions = {
      limit,
      offset: (page - 1) * limit,
      sortBy,
      sortOrder,
    };

    let looks: EditorialLookDTO[];
    if (query.published === true) {
      looks = await this.editorialLookManagementService.getPublishedLooks(serviceOptions);
    } else if (query.scheduled === true) {
      looks = await this.editorialLookManagementService.getScheduledLooks(serviceOptions);
    } else if (query.draft === true) {
      looks = await this.editorialLookManagementService.getDraftLooks(serviceOptions);
    } else if (query.hasContent === true) {
      looks = await this.editorialLookManagementService.getLooksWithContent(serviceOptions);
    } else if (query.hasContent === false) {
      looks = await this.editorialLookManagementService.getLooksWithoutContent(serviceOptions);
    } else {
      looks = await this.editorialLookManagementService.getAllEditorialLooks(serviceOptions);
    }

    return { looks, meta: { page, limit, sortBy, sortOrder } };
  }
}
