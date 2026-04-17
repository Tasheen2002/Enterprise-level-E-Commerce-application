import { ICommand, ICommandHandler, CommandResult } from "../../../../packages/core/src/application/cqrs";
import { SupplierDTO } from "../../domain/entities/supplier.entity";
import { SupplierContactProps } from "../../domain/value-objects/supplier-contact.vo";
import { SupplierManagementService } from "../services/supplier-management.service";

export interface CreateSupplierCommand extends ICommand {
  readonly name: string;
  readonly leadTimeDays?: number;
  readonly contacts?: SupplierContactProps[];
}

export class CreateSupplierHandler implements ICommandHandler<
  CreateSupplierCommand,
  CommandResult<SupplierDTO>
> {
  constructor(private readonly supplierService: SupplierManagementService) {}

  async handle(command: CreateSupplierCommand): Promise<CommandResult<SupplierDTO>> {
    const supplier = await this.supplierService.createSupplier(
      command.name,
      command.leadTimeDays,
      command.contacts,
    );
    return CommandResult.success(supplier);
  }
}
