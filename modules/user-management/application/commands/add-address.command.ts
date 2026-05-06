import { AddressManagementService } from '../services/address-management.service';
import { AddressDTO } from '../../domain/entities/address.entity';
import { AddressType } from '../../domain/value-objects/address-type.vo';
import { ICommand, ICommandHandler, CommandResult } from '../../../../packages/core/src/application/cqrs';

export interface AddAddressCommand extends ICommand {
  readonly userId: string;
  readonly type: 'billing' | 'shipping';
  readonly isDefault?: boolean;
  readonly firstName?: string;
  readonly lastName?: string;
  readonly company?: string;
  readonly addressLine1: string;
  readonly addressLine2?: string;
  readonly city: string;
  readonly state?: string;
  readonly postalCode?: string;
  readonly country: string;
  readonly phone?: string;
}

export class AddAddressHandler implements ICommandHandler<
  AddAddressCommand,
  CommandResult<AddressDTO>
> {
  constructor(private readonly addressService: AddressManagementService) { }

  async handle(
    command: AddAddressCommand
  ): Promise<CommandResult<AddressDTO>> {
    const result = await this.addressService.addAddress({
      userId: command.userId,
      addressData: {
        firstName: command.firstName,
        lastName: command.lastName,
        company: command.company,
        addressLine1: command.addressLine1,
        addressLine2: command.addressLine2,
        city: command.city,
        state: command.state,
        postalCode: command.postalCode,
        country: command.country,
        phone: command.phone,
      },
      type: AddressType.fromString(command.type),
      isDefault: command.isDefault,
    });

    return CommandResult.success(result);
  }
}
