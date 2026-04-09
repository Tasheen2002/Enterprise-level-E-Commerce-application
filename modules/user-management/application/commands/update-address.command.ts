import { AddressManagementService } from '../services/address-management.service';
import { AddressDTO } from '../../domain/entities/address.entity';
import { AddressType, AddressData } from '../../domain/value-objects/address.vo';
import {
  ICommand,
  ICommandHandler,
} from '../../../../packages/core/src/application/cqrs';
import { CommandResult } from '../../../../packages/core/src/application/command-result';

export interface UpdateAddressInput extends ICommand {
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
  UpdateAddressInput,
  CommandResult<AddressDTO>
> {
  constructor(private readonly addressService: AddressManagementService) {}

  async handle(
    input: UpdateAddressInput
  ): Promise<CommandResult<AddressDTO>> {
    const hasAddressFields =
      input.firstName !== undefined ||
      input.lastName !== undefined ||
      input.company !== undefined ||
      input.addressLine1 !== undefined ||
      input.addressLine2 !== undefined ||
      input.city !== undefined ||
      input.state !== undefined ||
      input.postalCode !== undefined ||
      input.country !== undefined ||
      input.phone !== undefined;

    const addressData: AddressData | undefined = hasAddressFields
      ? {
          firstName: input.firstName,
          lastName: input.lastName,
          company: input.company,
          addressLine1: input.addressLine1!,
          addressLine2: input.addressLine2,
          city: input.city!,
          state: input.state,
          postalCode: input.postalCode,
          country: input.country!,
          phone: input.phone,
        }
      : undefined;

    const type = input.type ? AddressType.fromString(input.type) : undefined;

    const result = await this.addressService.updateAddress({
      addressId: input.addressId,
      userId: input.userId,
      addressData,
      type,
      isDefault: input.isDefault,
    });

    return CommandResult.success(result);
  }
}
