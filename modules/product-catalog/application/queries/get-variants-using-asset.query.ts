import { IQuery, IQueryHandler } from "../../../../packages/core/src/application/cqrs";
import { VariantMediaManagementService } from "../services/variant-media-management.service";

export interface GetVariantsUsingAssetQuery extends IQuery {
  readonly assetId: string;
}

export class GetVariantsUsingAssetHandler implements IQueryHandler<GetVariantsUsingAssetQuery, string[]> {
  constructor(private readonly variantMediaManagementService: VariantMediaManagementService) {}

  async handle(query: GetVariantsUsingAssetQuery): Promise<string[]> {
    return this.variantMediaManagementService.getVariantsUsingAsset(query.assetId);
  }
}
