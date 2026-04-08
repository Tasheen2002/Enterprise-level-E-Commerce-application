import { ICommandHandler, CommandResult } from "@/api/src/shared/application";
import { Product } from "../../../domain/entities/product.entity";
import { ProductManagementService } from "../../services/product-management.service";
import { UpdateProductCommand } from "./update-product.command";

export class UpdateProductHandler implements ICommandHandler<UpdateProductCommand, CommandResult<Product>> {
  constructor(private readonly productManagementService: ProductManagementService) {}

  async handle(command: UpdateProductCommand): Promise<CommandResult<Product>> {
    try {
      const updateData = {
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
      };

      const filteredUpdateData = Object.fromEntries(
        Object.entries(updateData).filter(([_, value]) => value !== undefined),
      );

      const product = await this.productManagementService.updateProduct(
        command.productId,
        filteredUpdateData,
      );

      if (!product) {
        return CommandResult.failure<Product>("Product not found or update failed");
      }

      return CommandResult.success<Product>(product);
    } catch (error) {
      return CommandResult.failure<Product>(
        error instanceof Error ? error.message : "Product update failed",
      );
    }
  }
}
