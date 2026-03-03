import { ProductMediaManagementService } from "../services/product-media-management.service";
import { ProductMedia } from "../../domain/entities/product-media.entity";
import {
  ICommand,
  ICommandHandler,
  CommandResult,
} from "@/api/src/shared/application";

export interface AssociateProductMediaCommand extends ICommand {
  productId: string;
  assetId: string;
  position?: number;
  isCover?: boolean;
}

export class AssociateProductMediaHandler implements ICommandHandler<
  AssociateProductMediaCommand,
  CommandResult<string>
> {
  constructor(
    private readonly productMediaService: ProductMediaManagementService,
  ) {}

  async handle(
    command: AssociateProductMediaCommand,
  ): Promise<CommandResult<string>> {
    try {
      if (!command.productId) {
        return CommandResult.failure<string>("Product ID is required", [
          "productId",
        ]);
      }

      if (!command.assetId) {
        return CommandResult.failure<string>("Asset ID is required", [
          "assetId",
        ]);
      }

      const productMediaId = await this.productMediaService.addMediaToProduct(
        command.productId,
        command.assetId,
        command.position,
        command.isCover,
      );

      // Return the productMediaId as a success result
      return CommandResult.success<string>(productMediaId);
    } catch (error) {
      if (error instanceof Error) {
        return CommandResult.failure<string>(
          "Product media association failed",
          [error.message],
        );
      }

      return CommandResult.failure<string>(
        "An unexpected error occurred during product media association",
      );
    }
  }
}
