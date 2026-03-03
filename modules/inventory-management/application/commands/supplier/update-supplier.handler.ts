import { ICommandHandler, CommandResult } from "@/api/src/shared/application";
import { UpdateSupplierCommand } from "./update-supplier.command";
import { SupplierManagementService } from "../../services/supplier-management.service";
import { Supplier } from "../../../domain/entities/supplier.entity";

export class UpdateSupplierHandler implements ICommandHandler<
  UpdateSupplierCommand,
  CommandResult<Supplier>
> {
  constructor(private readonly supplierService: SupplierManagementService) {}

  async handle(
    command: UpdateSupplierCommand,
  ): Promise<CommandResult<Supplier>> {
    try {
      const supplier = await this.supplierService.updateSupplier(
        command.supplierId,
        {
          name: command.name,
          leadTimeDays: command.leadTimeDays,
          contacts: command.contacts,
        },
      );

      return CommandResult.success(supplier);
    } catch (error) {
      return CommandResult.failure<Supplier>(
        error instanceof Error ? error.message : "Unknown error occurred",
      );
    }
  }
}
