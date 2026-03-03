import {
  ICommand,
  ICommandHandler,
  CommandResult,
} from "@/api/src/shared/application";
import { LocationManagementService } from "../../services/location-management.service";

export interface DeleteLocationCommand extends ICommand {
  locationId: string;
}

export class DeleteLocationHandler implements ICommandHandler<
  DeleteLocationCommand,
  CommandResult<void>
> {
  constructor(private readonly locationService: LocationManagementService) {}

  async handle(command: DeleteLocationCommand): Promise<CommandResult<void>> {
    try {
      const errors: string[] = [];

      if (!command.locationId || command.locationId.trim().length === 0) {
        errors.push("locationId: Location ID is required");
      }

      if (errors.length > 0) {
        return CommandResult.failure<void>("Validation failed", errors);
      }

      await this.locationService.deleteLocation(command.locationId);

      return CommandResult.success();
    } catch (error) {
      return CommandResult.failure<void>(
        error instanceof Error ? error.message : "Unknown error occurred",
        [error instanceof Error ? error.message : "Unknown error"],
      );
    }
  }
}

