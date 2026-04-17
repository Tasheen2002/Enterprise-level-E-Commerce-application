import { ICommand, ICommandHandler, CommandResult } from "../../../../packages/core/src/application/cqrs";
import { SupplierManagementService } from "../services/supplier-management.service";

export interface DeleteSupplierCommand extends ICommand {
  readonly supplierId: string;
}

export class DeleteSupplierHandler implements ICommandHandler<
  DeleteSupplierCommand,
  CommandResult<void>
> {
  constructor(private readonly supplierService: SupplierManagementService) {}

  async handle(command: DeleteSupplierCommand): Promise<CommandResult<void>> {
    await this.supplierService.deleteSupplier(command.supplierId);
    return CommandResult.success();
  }
}
