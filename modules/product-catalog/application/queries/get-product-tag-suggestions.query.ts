import { IQuery, IQueryHandler } from "../../../../packages/core/src/application/cqrs";
import { ProductTagDTO } from "../../domain/entities/product-tag.entity";
import { ProductTagManagementService } from "../services/product-tag-management.service";
import { DEFAULT_SUGGESTIONS_LIMIT, MAX_SUGGESTIONS_LIMIT, MIN_LIMIT } from "../../domain/constants/pagination.constants";

export interface GetProductTagSuggestionsQuery extends IQuery {
  readonly query: string;
  readonly limit?: number;
}

export class GetProductTagSuggestionsHandler implements IQueryHandler<GetProductTagSuggestionsQuery, ProductTagDTO[]> {
  constructor(private readonly productTagManagementService: ProductTagManagementService) {}

  async handle(query: GetProductTagSuggestionsQuery): Promise<ProductTagDTO[]> {
    return this.productTagManagementService.getTagSuggestions(
      query.query.trim(),
      Math.min(MAX_SUGGESTIONS_LIMIT, Math.max(MIN_LIMIT, query.limit ?? DEFAULT_SUGGESTIONS_LIMIT)),
    );
  }
}
