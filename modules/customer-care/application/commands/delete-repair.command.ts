import { RepairService } from "../services/repair.service.js";

export interface ICommand {
  readonly commandId?: string;
  readonly timestamp?: Date;
}

export interface ICommandHandler<TCommand extends ICommand, TResult = void> {
  handle(command: TCommand): Promise<TResult>;
}

export class CommandResult<T = any> {
  constructor(
    public success: boolean,
    public data?: T,
    public error?: string,
    public errors?: string[]
  ) {}

  static success<T>(data?: T): CommandResult<T> {
    return new CommandResult(true, data);
  }

  static failure<T>(error: string, errors?: string[]): CommandResult<T> {
    return new CommandResult<T>(false, undefined, error, errors);
  }
}

export interface DeleteRepairCommand extends ICommand {
  repairId: string;
}

export class DeleteRepairHandler
  implements ICommandHandler<DeleteRepairCommand, CommandResult<void>>
{
  constructor(private readonly repairService: RepairService) {}

  async handle(command: DeleteRepairCommand): Promise<CommandResult<void>> {
    try {
      if (!command.repairId) {
        return CommandResult.failure<void>("Repair ID is required", [
          "repairId",
        ]);
      }

      await this.repairService.deleteRepair(command.repairId);

      return CommandResult.success<void>();
    } catch (error) {
      if (error instanceof Error) {
        return CommandResult.failure<void>("Failed to delete repair", [
          error.message,
        ]);
      }

      return CommandResult.failure<void>(
        "An unexpected error occurred while deleting repair"
      );
    }
  }
}
