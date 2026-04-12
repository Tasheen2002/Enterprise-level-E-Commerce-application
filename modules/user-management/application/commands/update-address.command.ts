import { AddressManagementService } from '../services/address-management.service';
import { AddressDTO } from '../../domain/entities/address.entity';
import { AddressType, AddressData } from '../../domain/value-objects/address.vo';
import { ICommand, ICommandHandler, CommandResult } from '../../../../packages/core/src/application/cqrs';

export interface UpdateAddressCommand extends ICommand {
  addressId: string;
  userId: string;
  type?: 'billing' | 'shipping';
  isDefault?: boolean;
  firstName?: string;
  lastName?: string;
  company?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  phone?: string;
}

export class UpdateAddressHandler implements ICommandHandler<
  UpdateAddressCommand,
  CommandResult<AddressDTO>
> {
  constructor(private readonly addressService: AddressManagementService) {}

  async handle(
    command: UpdateAddressCommand
  ): Promise<CommandResult<AddressDTO>> {
    const hasAddressFields =
      command.firstName !== undefined ||
      command.lastName !== undefined ||
      command.company !== undefined ||
      command.addressLine1 !== undefined ||
      command.addressLine2 !== undefined ||
      command.city !== undefined ||
      command.state !== undefined ||
      command.postalCode !== undefined ||
      command.country !== undefined ||
      command.phone !== undefined;

    const addressData: AddressData | undefined = hasAddressFields
      ? {
          firstName: command.firstName,
          lastName: command.lastName,
          company: command.company,
          addressLine1: command.addressLine1!,
          addressLine2: command.addressLine2,
          city: command.city!,
          state: command.state,
          postalCode: command.postalCode,
          country: command.country!,
          phone: command.phone,
        }
      : undefined;

    const type = command.type ? AddressType.fromString(command.type) : undefined;

    const result = await this.addressService.updateAddress({
      addressId: command.addressId,
      userId: command.userId,
      addressData,
      type,
      isDefault: command.isDefault,
    });

    return CommandResult.success(result);
  }
}
