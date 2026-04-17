import { IQuery, IQueryHandler } from "../../../../packages/core/src/application/cqrs";
import { EditorialLookManagementService } from "../services/editorial-look-management.service";

export interface GetProductEditorialLooksQuery extends IQuery {
  readonly productId: string;
}

export class GetProductEditorialLooksHandler implements IQueryHandler<GetProductEditorialLooksQuery, string[]> {
  constructor(private readonly editorialLookManagementService: EditorialLookManagementService) {}

  async handle(query: GetProductEditorialLooksQuery): Promise<string[]> {
    return this.editorialLookManagementService.getProductLooks(query.productId);
  }
}
