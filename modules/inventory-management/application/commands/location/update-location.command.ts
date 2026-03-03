import {
  ICommand,
  ICommandHandler,
  CommandResult,
} from "@/api/src/shared/application";
import { LocationManagementService } from "../../services/location-management.service";
import {
  Location,
  LocationAddress,
} from "../../../domain/entities/location.entity";

export interface UpdateLocationCommand extends ICommand {
  locationId: string;
  name?: string;
  address?: LocationAddress;
}

export class UpdateLocationHandler implements ICommandHandler<
  UpdateLocationCommand,
  CommandResult<Location>
> {
  constructor(private readonly locationService: LocationManagementService) {}

  async handle(
    command: UpdateLocationCommand,
  ): Promise<CommandResult<Location>> {
    try {
      const errors: string[] = [];

      if (!command.locationId || command.locationId.trim().length === 0) {
        errors.push("locationId: Location ID is required");
      }

      if (!command.name && !command.address) {
        errors.push("At least one field (name or address) must be provided");
      }

      if (command.name && command.name.trim().length === 0) {
        errors.push("name: Location name cannot be empty");
      }

      if (errors.length > 0) {
        return CommandResult.failure<Location>("Validation failed", errors);
      }

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
        [error instanceof Error ? error.message : "Unknown error"],
      );
    }
  }
}

