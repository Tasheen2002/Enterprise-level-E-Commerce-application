import { ProductTagManagementService } from "../services/product-tag-management.service";
import { ProductTag } from "../../domain/entities/product-tag.entity";
import {
  ICommand,
  ICommandHandler,
  CommandResult,
} from "@/api/src/shared/application";

export interface CreateProductTagCommand extends ICommand {
  tag: string;
  kind?: string;
}

export class CreateProductTagHandler implements ICommandHandler<
  CreateProductTagCommand,
  CommandResult<ProductTag>
> {
  constructor(
    private readonly tagManagementService: ProductTagManagementService,
  ) {}

  async handle(
    command: CreateProductTagCommand,
  ): Promise<CommandResult<ProductTag>> {
    try {
      if (!command.tag) {
        return CommandResult.failure<ProductTag>("Tag name is required", [
          "tag",
        ]);
      }

      const tagData = {
        tag: command.tag,
        kind: command.kind,
      };

      const productTag = await this.tagManagementService.createTag(tagData);
      return CommandResult.success<ProductTag>(productTag);
    } catch (error) {
      if (error instanceof Error) {
        return CommandResult.failure<ProductTag>(
          "Product tag creation failed",
          [error.message],
        );
      }

      return CommandResult.failure<ProductTag>(
        "An unexpected error occurred during product tag creation",
      );
    }
  }
}
