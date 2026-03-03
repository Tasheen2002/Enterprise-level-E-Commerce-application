import { ICommandHandler, CommandResult } from "@/api/src/shared/application";
import { DeleteLocationCommand } from "./delete-location.command";
import { LocationManagementService } from "../../services/location-management.service";

export class DeleteLocationHandler implements ICommandHandler<
  DeleteLocationCommand,
  CommandResult<void>
> {
  constructor(private readonly locationService: LocationManagementService) {}

  async handle(command: DeleteLocationCommand): Promise<CommandResult<void>> {
    try {
      await this.locationService.deleteLocation(command.locationId);

      return CommandResult.success();
    } catch (error) {
      return CommandResult.failure<void>(
        error instanceof Error ? error.message : "Unknown error occurred",
      );
    }
  }
}
