import { ICommand, ICommandHandler, CommandResult } from "../../../../packages/core/src/application/cqrs";
import { LocationDTO } from "../../domain/entities/location.entity";
import { LocationAddressProps } from "../../domain/value-objects/location-address.vo";
import { LocationManagementService } from "../services/location-management.service";

export interface UpdateLocationCommand extends ICommand {
  readonly locationId: string;
  readonly name?: string;
  readonly address?: LocationAddressProps;
}

export class UpdateLocationHandler implements ICommandHandler<
  UpdateLocationCommand,
  CommandResult<LocationDTO>
> {
  constructor(private readonly locationService: LocationManagementService) {}

  async handle(command: UpdateLocationCommand): Promise<CommandResult<LocationDTO>> {
    const location = await this.locationService.updateLocation(
      command.locationId,
      { name: command.name, address: command.address },
    );
    return CommandResult.success(location);
  }
}
