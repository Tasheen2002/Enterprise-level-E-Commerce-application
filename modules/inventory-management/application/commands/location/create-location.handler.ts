import { ICommandHandler, CommandResult } from "@/api/src/shared/application";
import { CreateLocationCommand } from "./create-location.command";
import { LocationManagementService } from "../../services/location-management.service";
import { Location } from "../../../domain/entities/location.entity";

export class CreateLocationHandler implements ICommandHandler<
  CreateLocationCommand,
  CommandResult<Location>
> {
  constructor(private readonly locationService: LocationManagementService) {}

  async handle(
    command: CreateLocationCommand,
  ): Promise<CommandResult<Location>> {
    try {
      const location = await this.locationService.createLocation(
        command.type,
        command.name,
        command.address,
      );

      return CommandResult.success(location);
    } catch (error) {
      return CommandResult.failure<Location>(
        error instanceof Error ? error.message : "Unknown error occurred",
      );
    }
  }
}
