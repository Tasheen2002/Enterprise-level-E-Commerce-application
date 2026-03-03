import { ICommandHandler, CommandResult } from "@/api/src/shared/application";
import { Product } from "../../domain/entities/product.entity";
import { ProductManagementService } from "../services/product-management.service";
import { CreateProductCommand } from "./create-product.command";

export class CreateProductHandler implements ICommandHandler<CreateProductCommand, CommandResult<Product>> {
  constructor(private readonly productManagementService: ProductManagementService) {}

  async handle(command: CreateProductCommand): Promise<CommandResult<Product>> {
    try {
      const product = await this.productManagementService.createProduct({
        title: command.title,
        brand: command.brand,
        shortDesc: command.shortDesc,
        longDescHtml: command.longDescHtml,
        status: command.status,
        publishAt: command.publishAt,
        countryOfOrigin: command.countryOfOrigin,
        seoTitle: command.seoTitle,
        seoDescription: command.seoDescription,
        price: command.price,
        priceSgd: command.priceSgd,
        priceUsd: command.priceUsd,
        compareAtPrice: command.compareAtPrice,
        categoryIds: command.categoryIds,
        tags: command.tags,
      });
      return CommandResult.success<Product>(product);
    } catch (error) {
      return CommandResult.failure<Product>(
        error instanceof Error ? error.message : "Product creation failed",
      );
    }
  }
}
