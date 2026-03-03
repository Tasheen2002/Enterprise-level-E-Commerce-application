import {
  ICommand,
  ICommandHandler,
  CommandResult,
} from "@/api/src/shared/application";
import { SupplierManagementService } from "../../services/supplier-management.service";

export interface DeleteSupplierCommand extends ICommand {
  supplierId: string;
}

export class DeleteSupplierHandler implements ICommandHandler<
  DeleteSupplierCommand,
  CommandResult<void>
> {
  constructor(private readonly supplierService: SupplierManagementService) {}

  async handle(command: DeleteSupplierCommand): Promise<CommandResult<void>> {
    try {
      const errors: string[] = [];

      if (!command.supplierId || command.supplierId.trim().length === 0) {
        errors.push("supplierId: Supplier ID is required");
      }

      if (errors.length > 0) {
        return CommandResult.failure<void>("Validation failed", errors);
      }

      await this.supplierService.deleteSupplier(command.supplierId);

      return CommandResult.success();
    } catch (error) {
      return CommandResult.failure<void>(
        error instanceof Error ? error.message : "Unknown error occurred",
        [error instanceof Error ? error.message : "Unknown error"],
      );
    }
  }
}

