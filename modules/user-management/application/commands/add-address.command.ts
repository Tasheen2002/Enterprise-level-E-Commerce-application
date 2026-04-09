import { AddressManagementService } from '../services/address-management.service';
import { AddressDTO } from '../../domain/entities/address.entity';
import { AddressType, AddressData } from '../../domain/value-objects/address.vo';
import {
  ICommand,
  ICommandHandler,
} from '../../../../packages/core/src/application/cqrs';
import { CommandResult } from '../../../../packages/core/src/application/command-result';

export interface AddAddressInput extends ICommand {
  userId: string;
  type: 'billing' | 'shipping';
  isDefault?: boolean;
  firstName?: string;
  lastName?: string;
  company?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state?: string;
  postalCode?: string;
  country: string;
  phone?: string;
}

export class AddAddressHandler implements ICommandHandler<
  AddAddressInput,
  CommandResult<AddressDTO>
> {
  constructor(private readonly addressService: AddressManagementService) {}

  async handle(
    input: AddAddressInput
  ): Promise<CommandResult<AddressDTO>> {
    const addressData: AddressData = {
      firstName: input.firstName,
      lastName: input.lastName,
      company: input.company,
      addressLine1: input.addressLine1,
      addressLine2: input.addressLine2,
      city: input.city,
      state: input.state,
      postalCode: input.postalCode,
      country: input.country,
      phone: input.phone,
    };

    const type = AddressType.fromString(input.type);

    const result = await this.addressService.addAddress({
      userId: input.userId,
      addressData,
      type,
      isDefault: input.isDefault,
    });

    return CommandResult.success(result);
  }
}
