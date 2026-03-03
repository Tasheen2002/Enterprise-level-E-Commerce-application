import { ICommandHandler, CommandResult } from "@/api/src/shared/application";
import { ProductTag } from "../../domain/entities/product-tag.entity";
import { ProductTagManagementService } from "../services/product-tag-management.service";
import { CreateProductTagCommand } from "./create-product-tag.command";

export class CreateProductTagHandler implements ICommandHandler<CreateProductTagCommand, CommandResult<ProductTag>> {
  constructor(private readonly tagManagementService: ProductTagManagementService) {}

  async handle(command: CreateProductTagCommand): Promise<CommandResult<ProductTag>> {
    try {
      const productTag = await this.tagManagementService.createTag({
        tag: command.tag,
        kind: command.kind,
      });
      return CommandResult.success<ProductTag>(productTag);
    } catch (error) {
      return CommandResult.failure<ProductTag>(
        error instanceof Error ? error.message : "Product tag creation failed",
      );
    }
  }
}
