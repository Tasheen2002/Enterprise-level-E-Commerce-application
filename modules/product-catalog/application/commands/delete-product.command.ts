import { ICommand, ICommandHandler, CommandResult } from "../../../../packages/core/src/application/cqrs";
import { ProductManagementService } from "../services/product-management.service";

export interface DeleteProductCommand extends ICommand {
  readonly productId: string;
}

export class DeleteProductHandler implements ICommandHandler<DeleteProductCommand, CommandResult<void>> {
  constructor(private readonly productManagementService: ProductManagementService) {}

  async handle(command: DeleteProductCommand): Promise<CommandResult<void>> {
    await this.productManagementService.deleteProduct(command.productId);
    return CommandResult.success(undefined);
  }
}
