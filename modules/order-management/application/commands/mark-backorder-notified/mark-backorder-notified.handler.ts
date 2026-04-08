import { ICommandHandler, CommandResult } from "@/api/src/shared/application";
import { MarkBackorderNotifiedCommand } from "./mark-backorder-notified.command";
import { BackorderManagementService } from "../../services/backorder-management.service";
import { Backorder } from "../../../domain/entities/backorder.entity";

export class MarkBackorderNotifiedCommandHandler implements ICommandHandler<
  MarkBackorderNotifiedCommand,
  CommandResult<Backorder>
> {
  constructor(private readonly backorderService: BackorderManagementService) {}

  async handle(
    command: MarkBackorderNotifiedCommand,
  ): Promise<CommandResult<Backorder>> {
    try {
      // Service throws if not found
      const backorder = await this.backorderService.markAsNotified(
        command.orderItemId,
      );

      return CommandResult.success(backorder);
    } catch (error) {
      return CommandResult.failure<Backorder>(
        error instanceof Error
          ? error.message
          : "An unexpected error occurred while marking backorder as notified",
        [error instanceof Error ? error.message : "Unknown error"],
      );
    }
  }
}
