import { ICommand, ICommandHandler, CommandResult } from "../../../../packages/core/src/application/cqrs";
import { ProductVariantDTO } from "../../domain/entities/product-variant.entity";
import { VariantManagementService } from "../services/variant-management.service";

export interface CreateProductVariantCommand extends ICommand {
  readonly productId: string;
  readonly sku: string;
  readonly size?: string;
  readonly color?: string;
  readonly barcode?: string;
  readonly weightG?: number;
  readonly dims?: { length?: number; width?: number; height?: number };
  readonly taxClass?: string;
  readonly allowBackorder?: boolean;
  readonly allowPreorder?: boolean;
  readonly restockEta?: Date;
}

export class CreateProductVariantHandler implements ICommandHandler<CreateProductVariantCommand, CommandResult<ProductVariantDTO>> {
  constructor(private readonly variantManagementService: VariantManagementService) {}

  async handle(command: CreateProductVariantCommand): Promise<CommandResult<ProductVariantDTO>> {
    const { productId, ...variantData } = command;
    const dto = await this.variantManagementService.createVariant(productId, variantData);
    return CommandResult.success(dto);
  }
}
