import { IQuery, IQueryHandler } from "../../../../packages/core/src/application/cqrs";
import {
  VariantMediaManagementService,
  SizeVariantMedia,
} from "../services/variant-media-management.service";

export interface GetSizeVariantMediaQuery extends IQuery {
  readonly productId: string;
  readonly size: string;
}

export type SizeVariantMediaResult = SizeVariantMedia;

export class GetSizeVariantMediaHandler implements IQueryHandler<GetSizeVariantMediaQuery, SizeVariantMediaResult> {
  constructor(private readonly variantMediaManagementService: VariantMediaManagementService) {}

  async handle(query: GetSizeVariantMediaQuery): Promise<SizeVariantMediaResult> {
    return this.variantMediaManagementService.getSizeVariantMedia(query.productId, query.size);
  }
}
