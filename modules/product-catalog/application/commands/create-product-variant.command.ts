import { VariantManagementService } from "../services/variant-management.service";
import { ProductVariant } from "../../domain/entities/product-variant.entity";
import {
  ICommand,
  ICommandHandler,
  CommandResult,
} from "@/api/src/shared/application";

export interface CreateProductVariantCommand extends ICommand {
  productId: string;
  sku: string;
  size?: string;
  color?: string;
  barcode?: string;
  weightG?: number;
  dims?: {
    length?: number;
    width?: number;
    height?: number;
  };
  taxClass?: string;
  allowBackorder?: boolean;
  allowPreorder?: boolean;
  restockEta?: Date;
}

export class CreateProductVariantHandler implements ICommandHandler<
  CreateProductVariantCommand,
  CommandResult<ProductVariant>
> {
  constructor(
    private readonly variantManagementService: VariantManagementService,
  ) {}

  async handle(
    command: CreateProductVariantCommand,
  ): Promise<CommandResult<ProductVariant>> {
    try {
      if (!command.productId) {
        return CommandResult.failure<ProductVariant>("Product ID is required", [
          "productId",
        ]);
      }

      if (!command.sku) {
        return CommandResult.failure<ProductVariant>("SKU is required", [
          "sku",
        ]);
      }

      const variantData = {
        sku: command.sku,
        size: command.size,
        color: command.color,
        barcode: command.barcode,
        weightG: command.weightG,
        dims: command.dims,
        taxClass: command.taxClass,
        allowBackorder: command.allowBackorder || false,
        allowPreorder: command.allowPreorder || false,
        restockEta: command.restockEta,
      };

      const variant = await this.variantManagementService.createVariant(
        command.productId,
        variantData,
      );
      return CommandResult.success<ProductVariant>(variant);
    } catch (error) {
      if (error instanceof Error) {
        return CommandResult.failure<ProductVariant>(
          "Variant creation failed",
          [error.message],
        );
      }

      return CommandResult.failure<ProductVariant>(
        "An unexpected error occurred during variant creation",
      );
    }
  }
}
