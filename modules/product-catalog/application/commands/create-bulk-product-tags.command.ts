import { ICommand, ICommandHandler, CommandResult } from "../../../../packages/core/src/application/cqrs";
import { ProductTagDTO } from "../../domain/entities/product-tag.entity";
import {
  ProductTagManagementService,
  CreateProductTagData,
} from "../services/product-tag-management.service";

export interface CreateBulkProductTagsCommand extends ICommand {
  readonly tags: CreateProductTagData[];
}

export class CreateBulkProductTagsHandler implements ICommandHandler<CreateBulkProductTagsCommand, CommandResult<ProductTagDTO[]>> {
  constructor(private readonly productTagManagementService: ProductTagManagementService) {}

  async handle(command: CreateBulkProductTagsCommand): Promise<CommandResult<ProductTagDTO[]>> {
    const dtos = await this.productTagManagementService.createMultipleTags(command.tags);
    return CommandResult.success(dtos);
  }
}
