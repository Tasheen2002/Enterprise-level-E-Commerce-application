import { IQuery, IQueryHandler } from "../../../../packages/core/src/application/cqrs";
import { VariantMediaManagementService } from "../services/variant-media-management.service";

export interface GetSizeVariantMediaQuery extends IQuery {
  productId: string;
  size: string;
}

export type SizeVariantMediaResult = Array<{
  size: string;
  variants: Array<{
    variantId: string;
    sku: string;
    color?: string;
    mediaAssets: Array<{ assetId: string; storageKey: string; mimeType: string }>;
  }>;
}>;

export class GetSizeVariantMediaHandler implements IQueryHandler<GetSizeVariantMediaQuery, SizeVariantMediaResult> {
  constructor(private readonly variantMediaManagementService: VariantMediaManagementService) {}

  async handle(query: GetSizeVariantMediaQuery): Promise<SizeVariantMediaResult> {
    return await this.variantMediaManagementService.getSizeVariantMedia(query.productId, decodeURIComponent(query.size));
  }
}
