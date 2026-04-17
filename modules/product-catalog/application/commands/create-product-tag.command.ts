import { ICommand, ICommandHandler, CommandResult } from "../../../../packages/core/src/application/cqrs";
import { ProductTagDTO } from "../../domain/entities/product-tag.entity";
import { ProductTagManagementService } from "../services/product-tag-management.service";

export interface CreateProductTagCommand extends ICommand {
  readonly tag: string;
  readonly kind?: string;
}

export class CreateProductTagHandler implements ICommandHandler<CreateProductTagCommand, CommandResult<ProductTagDTO>> {
  constructor(private readonly productTagManagementService: ProductTagManagementService) {}

  async handle(command: CreateProductTagCommand): Promise<CommandResult<ProductTagDTO>> {
    const dto = await this.productTagManagementService.createTag(command);
    return CommandResult.success(dto);
  }
}
