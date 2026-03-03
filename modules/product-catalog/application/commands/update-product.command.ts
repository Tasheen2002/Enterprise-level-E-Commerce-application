import { ProductManagementService } from "../services/product-management.service";
import { Product, ProductStatus } from "../../domain/entities/product.entity";
import {
  ICommand,
  ICommandHandler,
  CommandResult,
} from "@/api/src/shared/application";

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

export class UpdateProductHandler implements ICommandHandler<
  UpdateProductCommand,
  CommandResult<Product>
> {
  constructor(
    private readonly productManagementService: ProductManagementService,
  ) {}

  async handle(command: UpdateProductCommand): Promise<CommandResult<Product>> {
    try {
      // Validate command
      if (!command.productId) {
        return CommandResult.failure<Product>("Product ID is required", [
          "productId",
        ]);
      }

      // Validate price values if provided
      if (command.price !== undefined && command.price < 0) {
        return CommandResult.failure<Product>("Price must be non-negative", [
          "price",
        ]);
      }

      if (
        command.priceSgd !== undefined &&
        command.priceSgd !== null &&
        command.priceSgd < 0
      ) {
        return CommandResult.failure<Product>(
          "SGD price must be non-negative",
          ["priceSgd"],
        );
      }

      if (
        command.priceUsd !== undefined &&
        command.priceUsd !== null &&
        command.priceUsd < 0
      ) {
        return CommandResult.failure<Product>(
          "USD price must be non-negative",
          ["priceUsd"],
        );
      }

      if (
        command.compareAtPrice !== undefined &&
        command.compareAtPrice !== null &&
        command.compareAtPrice < 0
      ) {
        return CommandResult.failure<Product>(
          "Compare-at price must be non-negative",
          ["compareAtPrice"],
        );
      }

      // Validate title length if provided
      if (command.title !== undefined && command.title.trim().length === 0) {
        return CommandResult.failure<Product>("Title cannot be empty", [
          "title",
        ]);
      }

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

      // Remove undefined values to avoid overwriting with undefined
      const filteredUpdateData = Object.fromEntries(
        Object.entries(updateData).filter(([_, value]) => value !== undefined),
      );

      const product = await this.productManagementService.updateProduct(
        command.productId,
        filteredUpdateData,
      );

      if (!product) {
        return CommandResult.failure<Product>(
          "Product not found or update failed",
        );
      }

      return CommandResult.success<Product>(product);
    } catch (error) {
      if (error instanceof Error) {
        return CommandResult.failure<Product>("Product update failed", [
          error.message,
        ]);
      }

      return CommandResult.failure<Product>(
        "An unexpected error occurred during product update",
      );
    }
  }
}
