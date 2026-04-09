import { AddressManagementService } from '../services/address-management.service';
import {
  ICommand,
  ICommandHandler,
} from '../../../../packages/core/src/application/cqrs';
import { CommandResult } from '../../../../packages/core/src/application/command-result';

export interface DeleteAddressInput extends ICommand {
  addressId: string;
  userId: string;
}

export class DeleteAddressHandler implements ICommandHandler<
  DeleteAddressInput,
  CommandResult<void>
> {
  constructor(private readonly addressService: AddressManagementService) {}

  async handle(
    input: DeleteAddressInput
  ): Promise<CommandResult<void>> {
    await this.addressService.deleteAddress(input.addressId, input.userId);
    return CommandResult.success(undefined);
  }
}
