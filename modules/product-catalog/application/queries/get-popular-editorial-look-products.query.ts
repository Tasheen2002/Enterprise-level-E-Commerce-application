import { IQuery, IQueryHandler } from "../../../../packages/core/src/application/cqrs";
import { EditorialLookManagementService } from "../services/editorial-look-management.service";

export interface GetPopularEditorialLookProductsQuery extends IQuery {
  readonly limit?: number;
}

export class GetPopularEditorialLookProductsHandler implements IQueryHandler<GetPopularEditorialLookProductsQuery, Array<{ productId: string; appearanceCount: number }>> {
  constructor(private readonly editorialLookManagementService: EditorialLookManagementService) {}

  async handle(query: GetPopularEditorialLookProductsQuery): Promise<Array<{ productId: string; appearanceCount: number }>> {
    return this.editorialLookManagementService.getPopularProducts(
      Math.min(50, Math.max(1, query.limit ?? 10)),
    );
  }
}
