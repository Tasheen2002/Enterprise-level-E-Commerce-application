import { ICommand, ICommandHandler, CommandResult } from "@/api/src/shared/application";
import { ProductDTO, ProductStatus } from "../../domain/entities/product.entity";
import { ProductManagementService } from "../services/product-management.service";

export interface UpdateProductInput extends ICommand {
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

export class UpdateProductHandler implements ICommandHandler<UpdateProductInput, CommandResult<ProductDTO>> {
  constructor(private readonly productManagementService: ProductManagementService) {}

  async handle(input: UpdateProductInput): Promise<CommandResult<ProductDTO>> {
    const { productId, ...updates } = input;
    const dto = await this.productManagementService.updateProduct(productId, updates);
    return CommandResult.success(dto);
  }
}
