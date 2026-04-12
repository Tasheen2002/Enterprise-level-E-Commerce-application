import { IQuery, IQueryHandler } from "../../../../packages/core/src/application/cqrs";
import { MediaAssetDTO } from "../../domain/entities/media-asset.entity";
import { MediaManagementService } from "../services/media-management.service";

export interface GetMediaAssetQuery extends IQuery {
  id: string;
}

export class GetMediaAssetHandler implements IQueryHandler<GetMediaAssetQuery, MediaAssetDTO> {
  constructor(private readonly mediaManagementService: MediaManagementService) {}

  async handle(query: GetMediaAssetQuery): Promise<MediaAssetDTO> {
    return await this.mediaManagementService.getAssetById(query.id);
  }
}
