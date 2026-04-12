import { IQuery, IQueryHandler } from "../../../../packages/core/src/application/cqrs";
import { VariantMediaManagementService } from "../services/variant-media-management.service";

export interface ValidateVariantMediaQuery extends IQuery {
  variantId: string;
}

export interface VariantMediaValidationResult {
  isValid: boolean;
  issues: string[];
}

export class ValidateVariantMediaHandler implements IQueryHandler<ValidateVariantMediaQuery, VariantMediaValidationResult> {
  constructor(private readonly variantMediaManagementService: VariantMediaManagementService) {}

  async handle(query: ValidateVariantMediaQuery): Promise<VariantMediaValidationResult> {
    return await this.variantMediaManagementService.validateVariantMedia(query.variantId);
  }
}
