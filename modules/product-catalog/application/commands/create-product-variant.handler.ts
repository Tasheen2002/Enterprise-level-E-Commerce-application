import { ICommandHandler, CommandResult } from "@/api/src/shared/application";
import { ProductVariant } from "../../domain/entities/product-variant.entity";
import { VariantManagementService } from "../services/variant-management.service";
import { CreateProductVariantCommand } from "./create-product-variant.command";

export class CreateProductVariantHandler implements ICommandHandler<CreateProductVariantCommand, CommandResult<ProductVariant>> {
  constructor(private readonly variantManagementService: VariantManagementService) {}

  async handle(command: CreateProductVariantCommand): Promise<CommandResult<ProductVariant>> {
    try {
      const variant = await this.variantManagementService.createVariant(
        command.productId,
        {
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
        },
      );
      return CommandResult.success<ProductVariant>(variant);
    } catch (error) {
      return CommandResult.failure<ProductVariant>(
        error instanceof Error ? error.message : "Variant creation failed",
      );
    }
  }
}
