import { ICommandHandler, CommandResult } from "@/api/src/shared/application";
import { ProductManagementService } from "../../services/product-management.service";
import { DeleteProductCommand } from "./delete-product.command";

export class DeleteProductHandler implements ICommandHandler<DeleteProductCommand, CommandResult<boolean>> {
  constructor(private readonly productManagementService: ProductManagementService) {}

  async handle(command: DeleteProductCommand): Promise<CommandResult<boolean>> {
    try {
      await this.productManagementService.deleteProduct(command.productId);
      return CommandResult.success<boolean>(true);
    } catch (error) {
      return CommandResult.failure<boolean>(
        error instanceof Error ? error.message : "Product deletion failed",
      );
    }
  }
}
