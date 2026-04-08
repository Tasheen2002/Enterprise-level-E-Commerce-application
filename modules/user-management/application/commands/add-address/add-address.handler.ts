import { ICommandHandler, CommandResult } from "@/api/src/shared/application";
import { AddressManagementService } from "../../services/address-management.service";
import { AddressType, AddressData } from "../../../domain/value-objects/address.vo";
import { AddAddressCommand, AddAddressResult } from "./add-address.command";

export class AddAddressHandler implements ICommandHandler<AddAddressCommand, CommandResult<AddAddressResult>> {
  constructor(private readonly addressService: AddressManagementService) {}

  async handle(command: AddAddressCommand): Promise<CommandResult<AddAddressResult>> {
    try {
      const addressData: AddressData = {
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
      };

      const newAddress = await this.addressService.addAddress({
        userId: command.userId,
        addressData,
        type: AddressType.fromString(command.type),
        isDefault: command.isDefault || false,
      });

      return CommandResult.success<AddAddressResult>({
        addressId: newAddress.id,
        userId: command.userId,
        created: true,
        message: "Address added successfully",
      });
    } catch (error) {
      return CommandResult.failure<AddAddressResult>(
        error instanceof Error ? error.message : "Address creation failed",
      );
    }
  }
}
