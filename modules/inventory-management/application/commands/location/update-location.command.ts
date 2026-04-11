import { ICommand, ICommandHandler, CommandResult } from "@/api/src/shared/application";
import { LocationDTO } from "../../../domain/entities/location.entity";
import { LocationAddressProps } from "../../../domain/value-objects/location-address.vo";
import { LocationManagementService } from "../../services/location-management.service";

export interface UpdateLocationInput extends ICommand {
  locationId: string;
  name?: string;
  address?: LocationAddressProps;
}

export class UpdateLocationHandler implements ICommandHandler<
  UpdateLocationInput,
  CommandResult<LocationDTO>
> {
  constructor(private readonly locationService: LocationManagementService) {}

  async handle(input: UpdateLocationInput): Promise<CommandResult<LocationDTO>> {
    const location = await this.locationService.updateLocation(
      input.locationId,
      { name: input.name, address: input.address },
    );
    return CommandResult.success(location);
  }
}
