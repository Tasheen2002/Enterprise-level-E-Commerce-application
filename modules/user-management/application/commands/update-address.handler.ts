import { ICommandHandler, CommandResult } from "@/api/src/shared/application";
import { AddressManagementService } from "../services/address-management.service";
import { AddressType, AddressData } from "../../domain/value-objects/address.vo";
import { UpdateAddressCommand, UpdateAddressResult } from "./update-address.command";

export class UpdateAddressHandler implements ICommandHandler<UpdateAddressCommand, CommandResult<UpdateAddressResult>> {
  constructor(private readonly addressService: AddressManagementService) {}

  async handle(command: UpdateAddressCommand): Promise<CommandResult<UpdateAddressResult>> {
    try {
      let addressData: AddressData | undefined;
      const hasAddressFields = [
        command.firstName, command.lastName, command.company,
        command.addressLine1, command.addressLine2, command.city,
        command.state, command.postalCode, command.country, command.phone,
      ].some((v) => v !== undefined);

      if (hasAddressFields) {
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

      let addressType: AddressType | undefined;
      if (command.type) {
        addressType = command.type === "billing" ? AddressType.BILLING : AddressType.SHIPPING;
      }

      await this.addressService.updateAddress({
        addressId: command.addressId,
        userId: command.userId,
        addressData,
        type: addressType,
        isDefault: command.isDefault,
      });

      return CommandResult.success<UpdateAddressResult>({
        addressId: command.addressId,
        userId: command.userId,
        updated: true,
        message: "Address updated successfully",
      });
    } catch (error) {
      return CommandResult.failure<UpdateAddressResult>(
        error instanceof Error ? error.message : "Failed to update address",
      );
    }
  }
}
