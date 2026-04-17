import { ICommand, ICommandHandler, CommandResult } from "../../../../packages/core/src/application/cqrs";
import { LocationManagementService } from "../services/location-management.service";

export interface DeleteLocationCommand extends ICommand {
  readonly locationId: string;
}

export class DeleteLocationHandler implements ICommandHandler<
  DeleteLocationCommand,
  CommandResult<void>
> {
  constructor(private readonly locationService: LocationManagementService) {}

  async handle(command: DeleteLocationCommand): Promise<CommandResult<void>> {
    await this.locationService.deleteLocation(command.locationId);
    return CommandResult.success();
  }
}
