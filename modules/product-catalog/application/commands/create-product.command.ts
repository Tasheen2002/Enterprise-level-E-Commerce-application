import { ICommand, ICommandHandler, CommandResult } from "@/api/src/shared/application";
import { ProductDTO } from "../../domain/entities/product.entity";
import { ProductManagementService } from "../services/product-management.service";
import { ProductStatus } from "../../domain/entities/product.entity";

export interface CreateProductInput extends ICommand {
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

export class CreateProductHandler implements ICommandHandler<CreateProductInput, CommandResult<ProductDTO>> {
  constructor(private readonly productManagementService: ProductManagementService) {}

  async handle(input: CreateProductInput): Promise<CommandResult<ProductDTO>> {
    const dto = await this.productManagementService.createProduct(input);
    return CommandResult.success(dto);
  }
}
