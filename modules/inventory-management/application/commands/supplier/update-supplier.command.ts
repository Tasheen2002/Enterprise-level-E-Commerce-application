import { ICommand, ICommandHandler, CommandResult } from "@/api/src/shared/application";
import { SupplierDTO } from "../../../domain/entities/supplier.entity";
import { SupplierContactProps } from "../../../domain/value-objects/supplier-contact.vo";
import { SupplierManagementService } from "../../services/supplier-management.service";

export interface UpdateSupplierInput extends ICommand {
  supplierId: string;
  name?: string;
  leadTimeDays?: number;
  contacts?: SupplierContactProps[];
}

export class UpdateSupplierHandler implements ICommandHandler<
  UpdateSupplierInput,
  CommandResult<SupplierDTO>
> {
  constructor(private readonly supplierService: SupplierManagementService) {}

  async handle(input: UpdateSupplierInput): Promise<CommandResult<SupplierDTO>> {
    const supplier = await this.supplierService.updateSupplier(
      input.supplierId,
      {
        name: input.name,
        leadTimeDays: input.leadTimeDays,
        contacts: input.contacts,
      },
    );
    return CommandResult.success(supplier);
  }
}
