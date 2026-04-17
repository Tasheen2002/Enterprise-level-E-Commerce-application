import { ICommand, ICommandHandler, CommandResult } from "../../../../packages/core/src/application/cqrs";
import { ProductDTO } from "../../domain/entities/product.entity";
import { ProductManagementService } from "../services/product-management.service";
import { ProductStatus } from "../../domain/enums/product-catalog.enums";

export interface CreateProductCommand extends ICommand {
  readonly title: string;
  readonly brand?: string;
  readonly shortDesc?: string;
  readonly longDescHtml?: string;
  readonly status?: ProductStatus;
  readonly publishAt?: Date;
  readonly countryOfOrigin?: string;
  readonly seoTitle?: string;
  readonly seoDescription?: string;
  readonly price?: number;
  readonly priceSgd?: number;
  readonly priceUsd?: number;
  readonly compareAtPrice?: number;
  readonly categoryIds?: string[];
  readonly tags?: string[];
}

export class CreateProductHandler implements ICommandHandler<CreateProductCommand, CommandResult<ProductDTO>> {
  constructor(private readonly productManagementService: ProductManagementService) {}

  async handle(command: CreateProductCommand): Promise<CommandResult<ProductDTO>> {
    const dto = await this.productManagementService.createProduct(command);
    return CommandResult.success(dto);
  }
}
