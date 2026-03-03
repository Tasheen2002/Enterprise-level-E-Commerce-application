import {
  AddressManagementService,
  AddAddressDto,
} from "../services/address-management.service";
import {
  AddressType,
  AddressData,
} from "../../domain/value-objects/address.vo";
import {
  ICommand,
  ICommandHandler,
  CommandResult,
} from "@/api/src/shared/application";

export interface AddAddressCommand extends ICommand {
  userId: string;
  type: "billing" | "shipping";
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

export interface AddAddressResult {
  addressId: string;
  userId: string;
  created: boolean;
  message: string;
}

export class AddAddressHandler implements ICommandHandler<
  AddAddressCommand,
  CommandResult<AddAddressResult>
> {
  constructor(private readonly addressService: AddressManagementService) {}

  async handle(
    command: AddAddressCommand,
  ): Promise<CommandResult<AddAddressResult>> {
    try {
      // Validate command
      if (
        !command.userId ||
        !command.addressLine1 ||
        !command.city ||
        !command.country
      ) {
        return CommandResult.failure<AddAddressResult>(
          "Required fields missing: userId, addressLine1, city, country",
          ["userId", "addressLine1", "city", "country"],
        );
      }

      // Prepare address data
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

      // Add address through service
      const addAddressDto: AddAddressDto = {
        userId: command.userId,
        addressData: addressData,
        type: AddressType.fromString(command.type),
        isDefault: command.isDefault || false,
      };

      const newAddress = await this.addressService.addAddress(addAddressDto);

      const result: AddAddressResult = {
        addressId: newAddress.id,
        userId: command.userId,
        created: true,
        message: "Address added successfully",
      };

      return CommandResult.success<AddAddressResult>(result);
    } catch (error) {
      if (error instanceof Error) {
        return CommandResult.failure<AddAddressResult>(
          "Address creation failed",
          [error.message],
        );
      }

      return CommandResult.failure<AddAddressResult>(
        "An unexpected error occurred during address creation",
      );
    }
  }
}
