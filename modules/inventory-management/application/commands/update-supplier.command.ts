import { ICommand, ICommandHandler, CommandResult } from "../../../../packages/core/src/application/cqrs";
import { SupplierDTO } from "../../domain/entities/supplier.entity";
import { SupplierContactProps } from "../../domain/value-objects/supplier-contact.vo";
import { SupplierManagementService } from "../services/supplier-management.service";

export interface UpdateSupplierCommand extends ICommand {
  readonly supplierId: string;
  readonly name?: string;
  readonly leadTimeDays?: number;
  readonly contacts?: SupplierContactProps[];
}

export class UpdateSupplierHandler implements ICommandHandler<
  UpdateSupplierCommand,
  CommandResult<SupplierDTO>
> {
  constructor(private readonly supplierService: SupplierManagementService) {}

  async handle(command: UpdateSupplierCommand): Promise<CommandResult<SupplierDTO>> {
    const supplier = await this.supplierService.updateSupplier(
      command.supplierId,
      {
        name: command.name,
        leadTimeDays: command.leadTimeDays,
        contacts: command.contacts,
      },
    );
    return CommandResult.success(supplier);
  }
}
