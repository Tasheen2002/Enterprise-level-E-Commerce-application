import { ICommand, ICommandHandler, CommandResult } from "../../../../packages/core/src/application/cqrs";
import { LocationDTO } from "../../domain/entities/location.entity";
import { LocationAddressProps } from "../../domain/value-objects/location-address.vo";
import { LocationManagementService } from "../services/location-management.service";

export interface CreateLocationCommand extends ICommand {
  readonly type: string;
  readonly name: string;
  readonly address?: LocationAddressProps;
}

export class CreateLocationHandler implements ICommandHandler<
  CreateLocationCommand,
  CommandResult<LocationDTO>
> {
  constructor(private readonly locationService: LocationManagementService) {}

  async handle(command: CreateLocationCommand): Promise<CommandResult<LocationDTO>> {
    const location = await this.locationService.createLocation(
      command.type,
      command.name,
      command.address,
    );
    return CommandResult.success(location);
  }
}
