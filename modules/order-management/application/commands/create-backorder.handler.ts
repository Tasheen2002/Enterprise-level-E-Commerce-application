import { ICommandHandler, CommandResult } from "@/api/src/shared/application";
import { CreateBackorderCommand } from "./create-backorder.command";
import { BackorderManagementService } from "../services/backorder-management.service";
import { Backorder } from "../../domain/entities/backorder.entity";

export class CreateBackorderCommandHandler implements ICommandHandler<
  CreateBackorderCommand,
  CommandResult<Backorder>
> {
  constructor(private readonly backorderService: BackorderManagementService) {}

  async handle(
    command: CreateBackorderCommand,
  ): Promise<CommandResult<Backorder>> {
    try {
      const backorder = await this.backorderService.createBackorder({
        orderItemId: command.orderItemId,
        promisedEta: command.promisedEta,
      });

      return CommandResult.success(backorder);
    } catch (error) {
      return CommandResult.failure<Backorder>(
        error instanceof Error
          ? error.message
          : "An unexpected error occurred while creating backorder",
        [error instanceof Error ? error.message : "Unknown error"],
      );
    }
  }
}
