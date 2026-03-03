import { AddressManagementService } from "../services/address-management.service";
import {
  AddressType,
  AddressData,
} from "../../domain/value-objects/address.vo";
import {
  ICommand,
  ICommandHandler,
  CommandResult,
} from "@/api/src/shared/application";

export interface UpdateAddressCommand extends ICommand {
  addressId: string;
  userId: string;
  type?: "billing" | "shipping";
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

export interface UpdateAddressResult {
  addressId: string;
  userId: string;
  updated: boolean;
  message: string;
}

export class UpdateAddressHandler implements ICommandHandler<
  UpdateAddressCommand,
  CommandResult<UpdateAddressResult>
> {
  constructor(private readonly addressService: AddressManagementService) {}

  async handle(
    command: UpdateAddressCommand,
  ): Promise<CommandResult<UpdateAddressResult>> {
    try {
      // Validate command
      if (!command.addressId || !command.userId) {
        return CommandResult.failure<UpdateAddressResult>(
          "Address ID and User ID are required",
          ["addressId", "userId"],
        );
      }

      // Prepare address data for update (only if there are changes)
      let addressData: AddressData | undefined = undefined;
      if (
        command.firstName !== undefined ||
        command.lastName !== undefined ||
        command.company !== undefined ||
        command.addressLine1 !== undefined ||
        command.addressLine2 !== undefined ||
        command.city !== undefined ||
        command.state !== undefined ||
        command.postalCode !== undefined ||
        command.country !== undefined ||
        command.phone !== undefined
      ) {
        // Create AddressData with required fields having defaults
        addressData = {
          firstName: command.firstName || "",
          lastName: command.lastName || "",
          company: command.company || "",
          addressLine1: command.addressLine1 || "",
          addressLine2: command.addressLine2 || "",
          city: command.city || "",
          state: command.state || "",
          postalCode: command.postalCode || "",
          country: command.country || "",
          phone: command.phone || "",
        };
      }

      // Convert string type to AddressType enum if provided
      let addressType: AddressType | undefined = undefined;
      if (command.type) {
        addressType =
          command.type === "billing"
            ? AddressType.BILLING
            : AddressType.SHIPPING;
      }

      // Update address through service
      const updatedAddress = await this.addressService.updateAddress({
        addressId: command.addressId,
        userId: command.userId,
        addressData: addressData,
        type: addressType,
        isDefault: command.isDefault,
      });

      const result: UpdateAddressResult = {
        addressId: command.addressId,
        userId: command.userId,
        updated: true,
        message: "Address updated successfully",
      };

      return CommandResult.success<UpdateAddressResult>(result);
    } catch (error) {
      if (error instanceof Error) {
        return CommandResult.failure<UpdateAddressResult>(
          "Failed to update address",
          [error.message],
        );
      }

      return CommandResult.failure<UpdateAddressResult>(
        "An unexpected error occurred while updating address",
      );
    }
  }
}
