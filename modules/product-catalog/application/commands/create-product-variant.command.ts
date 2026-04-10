import { ICommand, ICommandHandler, CommandResult } from "@/api/src/shared/application";
import { ProductVariantDTO } from "../../domain/entities/product-variant.entity";
import { VariantManagementService } from "../services/variant-management.service";

export interface CreateProductVariantInput extends ICommand {
  productId: string;
  sku: string;
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

export class CreateProductVariantHandler implements ICommandHandler<CreateProductVariantInput, CommandResult<ProductVariantDTO>> {
  constructor(private readonly variantManagementService: VariantManagementService) {}

  async handle(input: CreateProductVariantInput): Promise<CommandResult<ProductVariantDTO>> {
    const { productId, ...variantData } = input;
    const dto = await this.variantManagementService.createVariant(productId, variantData);
    return CommandResult.success(dto);
  }
}
