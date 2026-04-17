import { IQuery, IQueryHandler } from "../../../../packages/core/src/application/cqrs";
import { ProductTagManagementService } from "../services/product-tag-management.service";

export interface ValidateProductTagQuery extends IQuery {
  readonly name: string;
}

export interface ProductTagValidationResult {
  readonly tagName: string;
  readonly isValid: boolean;
  readonly available: boolean;
}

export class ValidateProductTagHandler implements IQueryHandler<ValidateProductTagQuery, ProductTagValidationResult> {
  constructor(private readonly productTagManagementService: ProductTagManagementService) {}

  async handle(query: ValidateProductTagQuery): Promise<ProductTagValidationResult> {
    const isValid = await this.productTagManagementService.validateTag(decodeURIComponent(query.name));
    return { tagName: query.name, isValid, available: isValid };
  }
}
