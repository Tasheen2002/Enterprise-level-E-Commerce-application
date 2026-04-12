import { IQuery, IQueryHandler } from "../../../../packages/core/src/application/cqrs";
import { VariantMediaManagementService, VariantMediaSummary } from "../services/variant-media-management.service";

export interface GetVariantMediaQuery extends IQuery {
  variantId: string;
}

export class GetVariantMediaHandler implements IQueryHandler<GetVariantMediaQuery, VariantMediaSummary> {
  constructor(private readonly variantMediaManagementService: VariantMediaManagementService) {}

  async handle(query: GetVariantMediaQuery): Promise<VariantMediaSummary> {
    return await this.variantMediaManagementService.getVariantMedia(query.variantId);
  }
}
