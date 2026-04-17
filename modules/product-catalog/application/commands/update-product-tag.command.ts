import { ICommand, ICommandHandler, CommandResult } from "../../../../packages/core/src/application/cqrs";
import { ProductTagDTO } from "../../domain/entities/product-tag.entity";
import { ProductTagManagementService } from "../services/product-tag-management.service";

export interface UpdateProductTagCommand extends ICommand {
  readonly id: string;
  readonly tag?: string;
  readonly kind?: string;
}

export class UpdateProductTagHandler implements ICommandHandler<UpdateProductTagCommand, CommandResult<ProductTagDTO>> {
  constructor(private readonly productTagManagementService: ProductTagManagementService) {}

  async handle(command: UpdateProductTagCommand): Promise<CommandResult<ProductTagDTO>> {
    const { id, ...updates } = command;
    const dto = await this.productTagManagementService.updateTag(id, updates);
    return CommandResult.success(dto);
  }
}
