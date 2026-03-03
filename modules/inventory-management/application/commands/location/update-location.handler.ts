import { ICommandHandler, CommandResult } from "@/api/src/shared/application";
import { UpdateLocationCommand } from "./update-location.command";
import { LocationManagementService } from "../../services/location-management.service";
import { Location } from "../../../domain/entities/location.entity";

export class UpdateLocationHandler implements ICommandHandler<
  UpdateLocationCommand,
  CommandResult<Location>
> {
  constructor(private readonly locationService: LocationManagementService) {}

  async handle(
    command: UpdateLocationCommand,
  ): Promise<CommandResult<Location>> {
    try {
      const location = await this.locationService.updateLocation(
        command.locationId,
        {
          name: command.name,
          address: command.address,
        },
      );

      return CommandResult.success(location);
    } catch (error) {
      return CommandResult.failure<Location>(
        error instanceof Error ? error.message : "Unknown error occurred",
      );
    }
  }
}
