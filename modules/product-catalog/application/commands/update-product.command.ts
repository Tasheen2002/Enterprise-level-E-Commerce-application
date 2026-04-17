import { ICommand, ICommandHandler, CommandResult } from "../../../../packages/core/src/application/cqrs";
import { ProductDTO } from "../../domain/entities/product.entity";
import { ProductManagementService } from "../services/product-management.service";
import { ProductStatus } from "../../domain/enums/product-catalog.enums";

export interface UpdateProductCommand extends ICommand {
  readonly productId: string;
  readonly title?: string;
  readonly brand?: string;
  readonly shortDesc?: string;
  readonly longDescHtml?: string;
  readonly status?: ProductStatus;
  readonly publishAt?: Date;
  readonly countryOfOrigin?: string;
  readonly seoTitle?: string;
  readonly seoDescription?: string;
  readonly price?: number;
  readonly priceSgd?: number | null;
  readonly priceUsd?: number | null;
  readonly compareAtPrice?: number | null;
  readonly categoryIds?: string[];
  readonly tags?: string[];
}

export class UpdateProductHandler implements ICommandHandler<UpdateProductCommand, CommandResult<ProductDTO>> {
  constructor(private readonly productManagementService: ProductManagementService) {}

  async handle(command: UpdateProductCommand): Promise<CommandResult<ProductDTO>> {
    const { productId, ...rest } = command;
    const dto = await this.productManagementService.updateProduct(productId, rest);
    return CommandResult.success(dto);
  }
}
