import { ICommand, ICommandHandler, CommandResult } from "@/api/src/shared/application";
import { SupplierManagementService } from "../../services/supplier-management.service";

export interface DeleteSupplierInput extends ICommand {
  supplierId: string;
}

export class DeleteSupplierHandler implements ICommandHandler<
  DeleteSupplierInput,
  CommandResult<void>
> {
  constructor(private readonly supplierService: SupplierManagementService) {}

  async handle(input: DeleteSupplierInput): Promise<CommandResult<void>> {
    await this.supplierService.deleteSupplier(input.supplierId);
    return CommandResult.success();
  }
}
