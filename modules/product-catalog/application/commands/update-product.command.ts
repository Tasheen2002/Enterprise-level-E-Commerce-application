import { ICommand, ICommandHandler, CommandResult } from "../../../../packages/core/src/application/cqrs";
import { ProductDTO, ProductStatus } from "../../domain/entities/product.entity";
import { ProductManagementService } from "../services/product-management.service";

export interface UpdateProductCommand extends ICommand {
  productId: string;
  title?: string;
  brand?: string;
  shortDesc?: string;
  longDescHtml?: string;
  status?: ProductStatus;
  publishAt?: Date;
  countryOfOrigin?: string;
  seoTitle?: string;
  seoDescription?: string;
  price?: number;
  priceSgd?: number | null;
  priceUsd?: number | null;
  compareAtPrice?: number | null;
  categoryIds?: string[];
  tags?: string[];
}

export class UpdateProductHandler implements ICommandHandler<UpdateProductCommand, CommandResult<ProductDTO>> {
  constructor(private readonly productManagementService: ProductManagementService) {}

  async handle(command: UpdateProductCommand): Promise<CommandResult<ProductDTO>> {
    const { productId, ...updates } = command;
    const dto = await this.productManagementService.updateProduct(productId, updates);
    return CommandResult.success(dto);
  }
}
