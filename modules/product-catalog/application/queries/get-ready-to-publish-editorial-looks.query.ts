import { IQuery, IQueryHandler } from "../../../../packages/core/src/application/cqrs";
import { EditorialLookDTO } from "../../domain/entities/editorial-look.entity";
import { EditorialLookManagementService } from "../services/editorial-look-management.service";

export interface GetReadyToPublishEditorialLooksQuery extends IQuery {}

export class GetReadyToPublishEditorialLooksHandler implements IQueryHandler<GetReadyToPublishEditorialLooksQuery, EditorialLookDTO[]> {
  constructor(private readonly editorialLookManagementService: EditorialLookManagementService) {}

  async handle(_query: GetReadyToPublishEditorialLooksQuery): Promise<EditorialLookDTO[]> {
    return this.editorialLookManagementService.getReadyToPublishLooks();
  }
}
