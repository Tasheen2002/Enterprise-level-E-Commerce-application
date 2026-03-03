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

export interface CreateLocationCommand extends ICommand {
  type: string;
  name: string;
  address?: LocationAddress;
}

export class CreateLocationHandler implements ICommandHandler<
  CreateLocationCommand,
  CommandResult<Location>
> {
  constructor(private readonly locationService: LocationManagementService) {}

  async handle(
    command: CreateLocationCommand,
  ): Promise<CommandResult<Location>> {
    try {
      const errors: string[] = [];

      if (!command.type || command.type.trim().length === 0) {
        errors.push("type: Location type is required");
      }

      if (!command.name || command.name.trim().length === 0) {
        errors.push("name: Location name is required");
      }

      const validTypes = ["warehouse", "store", "vendor"];
      if (command.type && !validTypes.includes(command.type.toLowerCase())) {
        errors.push(
          `type: Location type must be one of: ${validTypes.join(", ")}`,
        );
      }

      if (errors.length > 0) {
        return CommandResult.failure<Location>("Validation failed", errors);
      }

      const location = await this.locationService.createLocation(
        command.type,
        command.name,
        command.address,
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

