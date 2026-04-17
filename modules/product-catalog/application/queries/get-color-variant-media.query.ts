import { IQuery, IQueryHandler } from "../../../../packages/core/src/application/cqrs";
import { VariantMediaManagementService, ColorVariantMedia } from "../services/variant-media-management.service";

export interface GetColorVariantMediaQuery extends IQuery {
  readonly productId: string;
  readonly color: string;
}

export class GetColorVariantMediaHandler implements IQueryHandler<GetColorVariantMediaQuery, ColorVariantMedia> {
  constructor(private readonly variantMediaManagementService: VariantMediaManagementService) {}

  async handle(query: GetColorVariantMediaQuery): Promise<ColorVariantMedia> {
    return this.variantMediaManagementService.getColorVariantMedia(query.productId, decodeURIComponent(query.color));
  }
}
