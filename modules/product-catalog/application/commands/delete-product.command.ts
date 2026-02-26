import { ProductManagementService } from "../services/product-management.service";
import {
  ICommand,
  ICommandHandler,
  CommandResult,
} from "@/api/src/shared/application";

export interface DeleteProductCommand extends ICommand {
  productId: string;
}

export class DeleteProductHandler implements ICommandHandler<
  DeleteProductCommand,
  CommandResult<boolean>
> {
  constructor(
    private readonly productManagementService: ProductManagementService,
  ) {}

  async handle(command: DeleteProductCommand): Promise<CommandResult<boolean>> {
    try {
      // Validate command
      if (!command.productId) {
        return CommandResult.failure<boolean>("Product ID is required", [
          "productId",
        ]);
      }

      await this.productManagementService.deleteProduct(command.productId);
      return CommandResult.success<boolean>(true);
    } catch (error) {
      if (error instanceof Error) {
        return CommandResult.failure<boolean>("Product deletion failed", [
          error.message,
        ]);
      }

      return CommandResult.failure<boolean>(
        "An unexpected error occurred during product deletion",
      );
    }
  }
}
