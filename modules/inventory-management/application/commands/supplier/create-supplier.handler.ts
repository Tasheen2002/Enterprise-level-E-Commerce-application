import { ICommandHandler, CommandResult } from "@/api/src/shared/application";
import { CreateSupplierCommand } from "./create-supplier.command";
import { SupplierManagementService } from "../../services/supplier-management.service";
import { Supplier } from "../../../domain/entities/supplier.entity";

export class CreateSupplierHandler implements ICommandHandler<
  CreateSupplierCommand,
  CommandResult<Supplier>
> {
  constructor(private readonly supplierService: SupplierManagementService) {}

  async handle(
    command: CreateSupplierCommand,
  ): Promise<CommandResult<Supplier>> {
    try {
      const supplier = await this.supplierService.createSupplier(
        command.name,
        command.leadTimeDays,
        command.contacts,
      );

      return CommandResult.success(supplier);
    } catch (error) {
      return CommandResult.failure<Supplier>(
        error instanceof Error ? error.message : "Unknown error occurred",
      );
    }
  }
}
