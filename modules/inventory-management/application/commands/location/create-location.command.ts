import { ICommand, ICommandHandler, CommandResult } from "@/api/src/shared/application";
import { LocationDTO } from "../../../domain/entities/location.entity";
import { LocationAddressProps } from "../../../domain/value-objects/location-address.vo";
import { LocationManagementService } from "../../services/location-management.service";

export interface CreateLocationInput extends ICommand {
  type: string;
  name: string;
  address?: LocationAddressProps;
}

export class CreateLocationHandler implements ICommandHandler<
  CreateLocationInput,
  CommandResult<LocationDTO>
> {
  constructor(private readonly locationService: LocationManagementService) {}

  async handle(input: CreateLocationInput): Promise<CommandResult<LocationDTO>> {
    const location = await this.locationService.createLocation(
      input.type,
      input.name,
      input.address,
    );
    return CommandResult.success(location);
  }
}
