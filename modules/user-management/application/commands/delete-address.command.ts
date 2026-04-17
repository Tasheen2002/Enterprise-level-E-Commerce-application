import { AddressManagementService } from '../services/address-management.service';
import { ICommand, ICommandHandler, CommandResult } from '../../../../packages/core/src/application/cqrs';

export interface DeleteAddressCommand extends ICommand {
  readonly addressId: string;
  readonly userId: string;
}

export class DeleteAddressHandler implements ICommandHandler<
  DeleteAddressCommand,
  CommandResult<void>
> {
  constructor(private readonly addressService: AddressManagementService) {}

  async handle(
    command: DeleteAddressCommand
  ): Promise<CommandResult<void>> {
    await this.addressService.deleteAddress(command.addressId, command.userId);
    return CommandResult.success(undefined);
  }
}
