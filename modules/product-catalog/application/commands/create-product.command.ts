import { ICommand, ICommandHandler, CommandResult } from "../../../../packages/core/src/application/cqrs";
import { ProductDTO } from "../../domain/entities/product.entity";
import { ProductManagementService } from "../services/product-management.service";
import { ProductStatus } from "../../domain/entities/product.entity";

export interface CreateProductCommand extends ICommand {
  title: string;
  brand?: string;
  shortDesc?: string;
  longDescHtml?: string;
  status?: ProductStatus;
  publishAt?: Date;
  countryOfOrigin?: string;
  seoTitle?: string;
  seoDescription?: string;
  price?: number;
  priceSgd?: number;
  priceUsd?: number;
  compareAtPrice?: number;
  categoryIds?: string[];
  tags?: string[];
}

export class CreateProductHandler implements ICommandHandler<CreateProductCommand, CommandResult<ProductDTO>> {
  constructor(private readonly productManagementService: ProductManagementService) {}

  async handle(command: CreateProductCommand): Promise<CommandResult<ProductDTO>> {
    const dto = await this.productManagementService.createProduct(command);
    return CommandResult.success(dto);
  }
}
