import { ICommand, ICommandHandler, CommandResult } from "@/api/src/shared/application";
import { SupplierDTO } from "../../../domain/entities/supplier.entity";
import { SupplierContactProps } from "../../../domain/value-objects/supplier-contact.vo";
import { SupplierManagementService } from "../../services/supplier-management.service";

export interface CreateSupplierInput extends ICommand {
  name: string;
  leadTimeDays?: number;
  contacts?: SupplierContactProps[];
}

export class CreateSupplierHandler implements ICommandHandler<
  CreateSupplierInput,
  CommandResult<SupplierDTO>
> {
  constructor(private readonly supplierService: SupplierManagementService) {}

  async handle(input: CreateSupplierInput): Promise<CommandResult<SupplierDTO>> {
    const supplier = await this.supplierService.createSupplier(
      input.name,
      input.leadTimeDays,
      input.contacts,
    );
    return CommandResult.success(supplier);
  }
}
