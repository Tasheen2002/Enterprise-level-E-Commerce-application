import { IQuery, IQueryHandler } from "../../../../packages/core/src/application/cqrs";
import { EditorialLookDTO } from "../../domain/entities/editorial-look.entity";
import { EditorialLookManagementService } from "../services/editorial-look-management.service";
import { EditorialLookQueryOptions } from "../../domain/repositories/editorial-look.repository";

export interface GetEditorialLooksByProductQuery extends IQuery {
  readonly productId: string;
  readonly page?: number;
  readonly limit?: number;
  readonly includeUnpublished?: boolean;
  readonly sortBy?: "title" | "publishedAt" | "id";
  readonly sortOrder?: "asc" | "desc";
}

export interface EditorialLooksByProductResult {
  readonly looks: EditorialLookDTO[];
  readonly meta: {
    readonly productId: string;
    readonly page: number;
    readonly limit: number;
    readonly includeUnpublished: boolean;
  };
}

export class GetEditorialLooksByProductHandler implements IQueryHandler<GetEditorialLooksByProductQuery, EditorialLooksByProductResult> {
  constructor(private readonly editorialLookManagementService: EditorialLookManagementService) {}

  async handle(query: GetEditorialLooksByProductQuery): Promise<EditorialLooksByProductResult> {
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(100, Math.max(1, query.limit ?? 20));
    const includeUnpublished = query.includeUnpublished ?? false;

    const serviceOptions: EditorialLookQueryOptions = {
      limit,
      offset: (page - 1) * limit,
      sortBy: query.sortBy ?? "id",
      sortOrder: query.sortOrder ?? "desc",
      includeUnpublished,
    };

    const looks = await this.editorialLookManagementService.getLooksByProduct(query.productId, serviceOptions);

    return { looks, meta: { productId: query.productId, page, limit, includeUnpublished } };
  }
}
