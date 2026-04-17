import { IQuery, IQueryHandler } from "../../../../packages/core/src/application/cqrs";
import { EditorialLookManagementService } from "../services/editorial-look-management.service";

export interface GetEditorialLookProductsQuery extends IQuery {
  readonly id: string;
}

export class GetEditorialLookProductsHandler implements IQueryHandler<GetEditorialLookProductsQuery, string[]> {
  constructor(private readonly editorialLookManagementService: EditorialLookManagementService) {}

  async handle(query: GetEditorialLookProductsQuery): Promise<string[]> {
    return this.editorialLookManagementService.getLookProducts(query.id);
  }
}
