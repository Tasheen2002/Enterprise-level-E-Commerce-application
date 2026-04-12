import { ICommand, ICommandHandler, CommandResult } from "../../../../packages/core/src/application/cqrs";
import { ProductVariantDTO } from "../../domain/entities/product-variant.entity";
import { VariantManagementService } from "../services/variant-management.service";

export interface UpdateProductVariantCommand extends ICommand {
  variantId: string;
  sku?: string;
  size?: string;
  color?: string;
  barcode?: string;
  weightG?: number;
  dims?: { length?: number; width?: number; height?: number };
  taxClass?: string;
  allowBackorder?: boolean;
  allowPreorder?: boolean;
  restockEta?: Date;
}

export class UpdateProductVariantHandler implements ICommandHandler<UpdateProductVariantCommand, CommandResult<ProductVariantDTO>> {
  constructor(private readonly variantManagementService: VariantManagementService) {}

  async handle(command: UpdateProductVariantCommand): Promise<CommandResult<ProductVariantDTO>> {
    const { variantId, ...updates } = command;
    const dto = await this.variantManagementService.updateVariant(variantId, updates);
    return CommandResult.success(dto);
  }
}
