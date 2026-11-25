import {
  type ICommand,
  type ICommandHandler,
  CommandResult,
} from "../../../../packages/core/src/application/cqrs";
import { ReturnRequestService } from "../services/return-request.service.js";
import { RmaStatus } from "../../domain/value-objects/rma-status.vo.js";

// Base interfaces

export interface ProcessRefundCommand extends ICommand {
  rmaId: string;
}

export class ProcessRefundHandler
  implements ICommandHandler<ProcessRefundCommand, CommandResult<void>>
{
  constructor(private readonly returnRequestService: ReturnRequestService) {}

  async handle(command: ProcessRefundCommand): Promise<CommandResult<void>> {
    try {
      if (!command.rmaId) {
        return CommandResult.failure<void>("RMA ID is required", ["rmaId"]);
      }

      // Mark the return request as refunded
      await this.returnRequestService.updateReturnRequest(command.rmaId, {
        status: RmaStatus.refunded(),
      });

      return CommandResult.success<void>();
    } catch (error) {
      if (error instanceof Error) {
        return CommandResult.failure<void>("Failed to process refund", [error.message]);
      }
      return CommandResult.failure<void>("An unexpected error occurred while processing refund");
    }
  }
}
