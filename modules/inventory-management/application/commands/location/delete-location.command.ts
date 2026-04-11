import { ICommand, ICommandHandler, CommandResult } from "@/api/src/shared/application";
import { LocationManagementService } from "../../services/location-management.service";

export interface DeleteLocationInput extends ICommand {
  locationId: string;
}

export class DeleteLocationHandler implements ICommandHandler<
  DeleteLocationInput,
  CommandResult<void>
> {
  constructor(private readonly locationService: LocationManagementService) {}

  async handle(input: DeleteLocationInput): Promise<CommandResult<void>> {
    await this.locationService.deleteLocation(input.locationId);
    return CommandResult.success();
  }
}
