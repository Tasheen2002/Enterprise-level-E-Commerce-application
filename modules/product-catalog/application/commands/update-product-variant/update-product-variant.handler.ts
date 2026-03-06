import { ICommandHandler, CommandResult } from "@/api/src/shared/application";
import { ProductVariant } from "../../../domain/entities/product-variant.entity";
import { VariantManagementService } from "../../services/variant-management.service";
import { UpdateProductVariantCommand } from "./update-product-variant.command";

export class UpdateProductVariantHandler implements ICommandHandler<UpdateProductVariantCommand, CommandResult<ProductVariant>> {
  constructor(private readonly variantManagementService: VariantManagementService) {}

  async handle(command: UpdateProductVariantCommand): Promise<CommandResult<ProductVariant>> {
    try {
      const updateData = {
        sku: command.sku,
        size: command.size,
        color: command.color,
        barcode: command.barcode,
        weightG: command.weightG,
        dims: command.dims,
        taxClass: command.taxClass,
        allowBackorder: command.allowBackorder,
        allowPreorder: command.allowPreorder,
        restockEta: command.restockEta,
      };

      const filteredUpdateData = Object.fromEntries(
        Object.entries(updateData).filter(([_, value]) => value !== undefined),
      );

      const variant = await this.variantManagementService.updateVariant(
        command.variantId,
        filteredUpdateData,
      );

      if (!variant) {
        return CommandResult.failure<ProductVariant>("Variant not found or update failed");
      }

      return CommandResult.success<ProductVariant>(variant);
    } catch (error) {
      return CommandResult.failure<ProductVariant>(
        error instanceof Error ? error.message : "Variant update failed",
      );
    }
  }
}
