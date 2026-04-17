import { IQuery, IQueryHandler } from "../../../../packages/core/src/application/cqrs";
import { ProductMediaManagementService } from "../services/product-media-management.service";

export interface ValidateProductMediaQuery extends IQuery {
  readonly productId: string;
}

export interface ProductMediaValidationResult {
  readonly isValid: boolean;
  readonly issues: string[];
}

export class ValidateProductMediaHandler implements IQueryHandler<ValidateProductMediaQuery, ProductMediaValidationResult> {
  constructor(private readonly productMediaManagementService: ProductMediaManagementService) {}

  async handle(query: ValidateProductMediaQuery): Promise<ProductMediaValidationResult> {
    return this.productMediaManagementService.validateProductMedia(query.productId);
  }
}
