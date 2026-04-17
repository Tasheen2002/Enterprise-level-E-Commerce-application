import { IQuery, IQueryHandler } from "../../../../packages/core/src/application/cqrs";
import { EditorialLookDTO } from "../../domain/entities/editorial-look.entity";
import { EditorialLookManagementService } from "../services/editorial-look-management.service";

export interface GetEditorialLookQuery extends IQuery {
  readonly id: string;
}

export class GetEditorialLookHandler implements IQueryHandler<GetEditorialLookQuery, EditorialLookDTO> {
  constructor(private readonly editorialLookManagementService: EditorialLookManagementService) {}

  async handle(query: GetEditorialLookQuery): Promise<EditorialLookDTO> {
    return this.editorialLookManagementService.getEditorialLookById(query.id);
  }
}
