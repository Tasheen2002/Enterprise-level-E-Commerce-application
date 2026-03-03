import { ICommandHandler, CommandResult } from "@/api/src/shared/application";
import { UpdateBackorderEtaCommand } from "./update-backorder-eta.command";
import { BackorderManagementService } from "../services/backorder-management.service";
import { Backorder } from "../../domain/entities/backorder.entity";

export class UpdateBackorderEtaCommandHandler implements ICommandHandler<
  UpdateBackorderEtaCommand,
  CommandResult<Backorder>
> {
  constructor(private readonly backorderService: BackorderManagementService) {}

  async handle(
    command: UpdateBackorderEtaCommand,
  ): Promise<CommandResult<Backorder>> {
    try {
      const backorder = await this.backorderService.updatePromisedEta(
        command.orderItemId,
        command.promisedEta,
      );

      if (!backorder) {
        return CommandResult.failure<Backorder>("Backorder not found");
      }

      return CommandResult.success(backorder);
    } catch (error) {
      return CommandResult.failure<Backorder>(
        error instanceof Error
          ? error.message
          : "An unexpected error occurred while updating backorder ETA",
        [error instanceof Error ? error.message : "Unknown error"],
      );
    }
  }
}
