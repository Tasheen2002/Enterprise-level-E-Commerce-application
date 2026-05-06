import { IQuery, IQueryHandler } from "../../../../packages/core/src/application/cqrs";
import { EditorialLookManagementService } from "../services/editorial-look-management.service";
import { DEFAULT_SUGGESTIONS_LIMIT, MAX_SUGGESTIONS_LIMIT, MIN_LIMIT } from "../../domain/constants/pagination.constants";

export interface GetPopularEditorialLookProductsQuery extends IQuery {
  readonly limit?: number;
}

export interface PopularEditorialLookProductResult {
  readonly productId: string;
  readonly appearanceCount: number;
}

export class GetPopularEditorialLookProductsHandler implements IQueryHandler<GetPopularEditorialLookProductsQuery, PopularEditorialLookProductResult[]> {
  constructor(private readonly editorialLookManagementService: EditorialLookManagementService) {}

  async handle(query: GetPopularEditorialLookProductsQuery): Promise<PopularEditorialLookProductResult[]> {
    return this.editorialLookManagementService.getPopularProducts(
      Math.min(MAX_SUGGESTIONS_LIMIT, Math.max(MIN_LIMIT, query.limit ?? DEFAULT_SUGGESTIONS_LIMIT)),
    );
  }
}
