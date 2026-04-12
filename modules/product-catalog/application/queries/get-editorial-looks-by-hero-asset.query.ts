import { IQuery, IQueryHandler } from "../../../../packages/core/src/application/cqrs";
import { EditorialLookDTO } from "../../domain/entities/editorial-look.entity";
import { EditorialLookManagementService } from "../services/editorial-look-management.service";

export interface GetEditorialLooksByHeroAssetQuery extends IQuery {
  assetId: string;
}

export class GetEditorialLooksByHeroAssetHandler implements IQueryHandler<GetEditorialLooksByHeroAssetQuery, EditorialLookDTO[]> {
  constructor(private readonly editorialLookManagementService: EditorialLookManagementService) {}

  async handle(query: GetEditorialLooksByHeroAssetQuery): Promise<EditorialLookDTO[]> {
    return await this.editorialLookManagementService.getLooksByHeroAsset(query.assetId);
  }
}
