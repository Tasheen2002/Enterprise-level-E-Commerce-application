import { ICommandHandler, CommandResult } from "@/api/src/shared/application";
import { DeleteSupplierCommand } from "./delete-supplier.command";
import { SupplierManagementService } from "../../services/supplier-management.service";

export class DeleteSupplierHandler implements ICommandHandler<
  DeleteSupplierCommand,
  CommandResult<void>
> {
  constructor(private readonly supplierService: SupplierManagementService) {}

  async handle(command: DeleteSupplierCommand): Promise<CommandResult<void>> {
    try {
      await this.supplierService.deleteSupplier(command.supplierId);

      return CommandResult.success();
    } catch (error) {
      return CommandResult.failure<void>(
        error instanceof Error ? error.message : "Unknown error occurred",
      );
    }
  }
}
