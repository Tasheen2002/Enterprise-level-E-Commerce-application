import { ICommand, ICommandHandler, CommandResult } from "../../../../packages/core/src/application/cqrs";
import { ProductVariantDTO } from "../../domain/entities/product-variant.entity";
import { VariantManagementService } from "../services/variant-management.service";

export interface CreateProductVariantCommand extends ICommand {
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

export class CreateProductVariantHandler implements ICommandHandler<CreateProductVariantCommand, CommandResult<ProductVariantDTO>> {
  constructor(private readonly variantManagementService: VariantManagementService) {}

  async handle(command: CreateProductVariantCommand): Promise<CommandResult<ProductVariantDTO>> {
    const { productId, ...variantData } = command;
    const dto = await this.variantManagementService.createVariant(productId, variantData);
    return CommandResult.success(dto);
  }
}
