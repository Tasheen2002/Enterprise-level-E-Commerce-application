import {
  ICommand,
  ICommandHandler,
  CommandResult,
} from "@/api/src/shared/application";
import { SupplierManagementService } from "../../services/supplier-management.service";
import {
  Supplier,
  SupplierContact,
} from "../../../domain/entities/supplier.entity";

export interface CreateSupplierCommand extends ICommand {
  name: string;
  leadTimeDays?: number;
  contacts?: SupplierContact[];
}

export class CreateSupplierHandler implements ICommandHandler<
  CreateSupplierCommand,
  CommandResult<Supplier>
> {
  constructor(private readonly supplierService: SupplierManagementService) {}

  async handle(
    command: CreateSupplierCommand,
  ): Promise<CommandResult<Supplier>> {
    try {
      const errors: string[] = [];

      if (!command.name || command.name.trim().length === 0) {
        errors.push("name: Supplier name is required");
      }

      if (command.leadTimeDays !== undefined && command.leadTimeDays < 0) {
        errors.push("leadTimeDays: Lead time days cannot be negative");
      }

      if (errors.length > 0) {
        return CommandResult.failure<Supplier>("Validation failed", errors);
      }

      const supplier = await this.supplierService.createSupplier(
        command.name,
        command.leadTimeDays,
        command.contacts,
      );

      return CommandResult.success(supplier);
    } catch (error) {
      return CommandResult.failure<Supplier>(
        error instanceof Error ? error.message : "Unknown error occurred",
        [error instanceof Error ? error.message : "Unknown error"],
      );
    }
  }
}

