import { ICommand, ICommandHandler, CommandResult } from "../../../../packages/core/src/application/cqrs";
import { ProductVariantDTO } from "../../domain/entities/product-variant.entity";
import { VariantManagementService } from "../services/variant-management.service";

export interface UpdateProductVariantCommand extends ICommand {
  readonly variantId: string;
  readonly sku?: string;
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

export class UpdateProductVariantHandler implements ICommandHandler<UpdateProductVariantCommand, CommandResult<ProductVariantDTO>> {
  constructor(private readonly variantManagementService: VariantManagementService) {}

  async handle(command: UpdateProductVariantCommand): Promise<CommandResult<ProductVariantDTO>> {
    const { variantId, ...updates } = command;
    const dto = await this.variantManagementService.updateVariant(variantId, updates);
    return CommandResult.success(dto);
  }
}
