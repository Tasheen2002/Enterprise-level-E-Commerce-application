import { ICommandHandler, CommandResult } from "@/api/src/shared/application";
import { ProductMediaManagementService } from "../services/product-media-management.service";
import { AssociateProductMediaCommand } from "./associate-product-media.command";

export class AssociateProductMediaHandler implements ICommandHandler<AssociateProductMediaCommand, CommandResult<string>> {
  constructor(private readonly productMediaService: ProductMediaManagementService) {}

  async handle(command: AssociateProductMediaCommand): Promise<CommandResult<string>> {
    try {
      const productMediaId = await this.productMediaService.addMediaToProduct(
        command.productId,
        command.assetId,
        command.position,
        command.isCover,
      );
      return CommandResult.success<string>(productMediaId);
    } catch (error) {
      return CommandResult.failure<string>(
        error instanceof Error ? error.message : "Product media association failed",
      );
    }
  }
}
