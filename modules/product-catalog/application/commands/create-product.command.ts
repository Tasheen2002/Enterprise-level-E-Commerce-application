import { ProductManagementService } from "../services/product-management.service";
import { Product, ProductStatus } from "../../domain/entities/product.entity";
import {
  ICommand,
  ICommandHandler,
  CommandResult,
} from "@/api/src/shared/application";

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

export class CreateProductHandler implements ICommandHandler<
  CreateProductCommand,
  CommandResult<Product>
> {
  constructor(
    private readonly productManagementService: ProductManagementService,
  ) {}

  async handle(command: CreateProductCommand): Promise<CommandResult<Product>> {
    try {
      // Validate command
      if (!command.title) {
        return CommandResult.failure<Product>("Product title is required", [
          "title",
        ]);
      }

      const productData = {
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

      const product =
        await this.productManagementService.createProduct(productData);
      return CommandResult.success<Product>(product);
    } catch (error) {
      if (error instanceof Error) {
        return CommandResult.failure<Product>(
          error.message, // Use actual error message instead of generic "Product creation failed"
          [error.message],
        );
      }

      return CommandResult.failure<Product>(
        "An unexpected error occurred during product creation",
      );
    }
  }
}
