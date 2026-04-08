import { ICommandHandler, CommandResult } from "@/api/src/shared/application";
import { ProductManagementService } from "../../services/product-management.service";
import { DeleteProductCommand } from "./delete-product.command";

export class DeleteProductHandler implements ICommandHandler<
  DeleteProductCommand,
  CommandResult<void>
> {
  constructor(
    private readonly productManagementService: ProductManagementService,
  ) {}

  async handle(command: DeleteProductCommand): Promise<CommandResult<void>> {
    try {
      await this.productManagementService.deleteProduct(command.productId);
      return CommandResult.success<void>(undefined);
    } catch (error) {
      return CommandResult.failure<void>(
        error instanceof Error ? error.message : "Product deletion failed",
      );
    }
  }
}
