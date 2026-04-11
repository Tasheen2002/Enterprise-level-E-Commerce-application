import { ICommand, ICommandHandler, CommandResult } from "@/api/src/shared/application";
import { ProductVariantDTO } from "../../domain/entities/product-variant.entity";
import { VariantManagementService } from "../services/variant-management.service";

export interface UpdateProductVariantInput extends ICommand {
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

export class UpdateProductVariantHandler implements ICommandHandler<UpdateProductVariantInput, CommandResult<ProductVariantDTO>> {
  constructor(private readonly variantManagementService: VariantManagementService) {}

  async handle(input: UpdateProductVariantInput): Promise<CommandResult<ProductVariantDTO>> {
    const { variantId, ...updates } = input;
    const dto = await this.variantManagementService.updateVariant(variantId, updates);
    return CommandResult.success(dto);
  }
}
