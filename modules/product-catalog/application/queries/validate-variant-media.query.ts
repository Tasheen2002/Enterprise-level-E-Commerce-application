import { IQuery, IQueryHandler } from "../../../../packages/core/src/application/cqrs";
import { VariantMediaManagementService } from "../services/variant-media-management.service";

export interface ValidateVariantMediaQuery extends IQuery {
  readonly variantId: string;
}

export interface VariantMediaValidationResult {
  readonly isValid: boolean;
  readonly issues: string[];
}

export class ValidateVariantMediaHandler implements IQueryHandler<ValidateVariantMediaQuery, VariantMediaValidationResult> {
  constructor(private readonly variantMediaManagementService: VariantMediaManagementService) {}

  async handle(query: ValidateVariantMediaQuery): Promise<VariantMediaValidationResult> {
    return this.variantMediaManagementService.validateVariantMedia(query.variantId);
  }
}
