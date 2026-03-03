import { AddressManagementService } from "../services/address-management.service";
import {
  ICommand,
  ICommandHandler,
  CommandResult,
} from "@/api/src/shared/application";

export interface DeleteAddressCommand extends ICommand {
  addressId: string;
  userId: string;
}

export interface DeleteAddressResult {
  addressId: string;
  userId: string;
  deleted: boolean;
  message: string;
}

export class DeleteAddressHandler implements ICommandHandler<
  DeleteAddressCommand,
  CommandResult<DeleteAddressResult>
> {
  constructor(private readonly addressService: AddressManagementService) {}

  async handle(
    command: DeleteAddressCommand,
  ): Promise<CommandResult<DeleteAddressResult>> {
    try {
      // Validate command
      if (!command.addressId || !command.userId) {
        return CommandResult.failure<DeleteAddressResult>(
          "Address ID and User ID are required",
          ["addressId", "userId"],
        );
      }

      // Delete address through service
      await this.addressService.deleteAddress(
        command.addressId,
        command.userId,
      );

      const result: DeleteAddressResult = {
        addressId: command.addressId,
        userId: command.userId,
        deleted: true,
        message: "Address deleted successfully",
      };

      return CommandResult.success<DeleteAddressResult>(result);
    } catch (error) {
      if (error instanceof Error) {
        return CommandResult.failure<DeleteAddressResult>(
          "Failed to delete address",
          [error.message],
        );
      }

      return CommandResult.failure<DeleteAddressResult>(
        "An unexpected error occurred while deleting address",
      );
    }
  }
}
