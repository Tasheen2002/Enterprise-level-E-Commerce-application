import { IQuery, IQueryHandler } from "../../../../packages/core/src/application/cqrs";
import { ProductTagDTO } from "../../domain/entities/product-tag.entity";
import { ProductTagManagementService } from "../services/product-tag-management.service";

export interface GetProductTagSuggestionsQuery extends IQuery {
  query: string;
  limit?: number;
}

export class GetProductTagSuggestionsHandler implements IQueryHandler<GetProductTagSuggestionsQuery, ProductTagDTO[]> {
  constructor(private readonly productTagManagementService: ProductTagManagementService) {}

  async handle(input: GetProductTagSuggestionsQuery): Promise<ProductTagDTO[]> {
    return await this.productTagManagementService.getTagSuggestions(
      input.query.trim(),
      Math.min(50, Math.max(1, input.limit ?? 10)),
    );
  }
}
