import { ICommand, ICommandHandler, CommandResult } from "@/api/src/shared/application";
import { ProductManagementService } from "../services/product-management.service";

export interface DeleteProductInput extends ICommand {
  productId: string;
}

export class DeleteProductHandler implements ICommandHandler<DeleteProductInput, CommandResult<void>> {
  constructor(private readonly productManagementService: ProductManagementService) {}

  async handle(input: DeleteProductInput): Promise<CommandResult<void>> {
    await this.productManagementService.deleteProduct(input.productId);
    return CommandResult.success(undefined);
  }
}
