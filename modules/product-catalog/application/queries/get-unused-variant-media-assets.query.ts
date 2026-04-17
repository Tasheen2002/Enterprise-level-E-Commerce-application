import { IQuery, IQueryHandler } from "../../../../packages/core/src/application/cqrs";
import { VariantMediaManagementService } from "../services/variant-media-management.service";

export interface GetUnusedVariantMediaAssetsQuery extends IQuery {
  readonly productId?: string;
}

export interface UnusedVariantMediaAssetsResult {
  readonly assets: string[];
  readonly meta: { productId: string };
}

export class GetUnusedVariantMediaAssetsHandler implements IQueryHandler<GetUnusedVariantMediaAssetsQuery, UnusedVariantMediaAssetsResult> {
  constructor(private readonly variantMediaManagementService: VariantMediaManagementService) {}

  async handle(query: GetUnusedVariantMediaAssetsQuery): Promise<UnusedVariantMediaAssetsResult> {
    const assets = await this.variantMediaManagementService.getUnusedAssets(query.productId);
    return { assets, meta: { productId: query.productId ?? "all" } };
  }
}
