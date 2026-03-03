import { ICommandHandler, CommandResult } from "@/api/src/shared/application";
import { AddressManagementService } from "../services/address-management.service";
import { DeleteAddressCommand, DeleteAddressResult } from "./delete-address.command";

export class DeleteAddressHandler implements ICommandHandler<DeleteAddressCommand, CommandResult<DeleteAddressResult>> {
  constructor(private readonly addressService: AddressManagementService) {}

  async handle(command: DeleteAddressCommand): Promise<CommandResult<DeleteAddressResult>> {
    try {
      await this.addressService.deleteAddress(command.addressId, command.userId);
      return CommandResult.success<DeleteAddressResult>({
        addressId: command.addressId,
        userId: command.userId,
        deleted: true,
        message: "Address deleted successfully",
      });
    } catch (error) {
      return CommandResult.failure<DeleteAddressResult>(
        error instanceof Error ? error.message : "Failed to delete address",
      );
    }
  }
}
