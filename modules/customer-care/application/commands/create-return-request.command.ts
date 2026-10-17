import {
  type ICommand,
  type ICommandHandler,
  CommandResult,
} from "../../../../packages/core/src/application/cqrs";
import { ReturnRequestService } from "../services/return-request.service.js";
import { RmaType } from "../../domain/value-objects/rma-type.vo.js";

// Base interfaces

export interface CreateReturnRequestCommand extends ICommand {
  orderId: string;
  type: string;
  reason?: string;
}

export interface ReturnRequestResult {
  rmaId: string;
  orderId: string;
  type: string;
  reason?: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export class CreateReturnRequestHandler
  implements ICommandHandler<CreateReturnRequestCommand, CommandResult<ReturnRequestResult>>
{
  constructor(private readonly returnRequestService: ReturnRequestService) {}

  async handle(command: CreateReturnRequestCommand): Promise<CommandResult<ReturnRequestResult>> {
    try {
      if (!command.orderId) {
        return CommandResult.failure<ReturnRequestResult>("Order ID is required", ["orderId"]);
      }
      if (!command.type) {
        return CommandResult.failure<ReturnRequestResult>("Type is required", ["type"]);
      }

      const type = RmaType.fromString(command.type);
      const request = await this.returnRequestService.createReturnRequest({
        orderId: command.orderId,
        type,
        reason: command.reason,
      });

      const result: ReturnRequestResult = {
        rmaId: request.getRmaId().getValue(),
        orderId: request.getOrderId(),
        type: request.getType().getValue(),
        reason: request.getReason(),
        status: request.getStatus().getValue(),
        createdAt: request.getCreatedAt(),
        updatedAt: request.getUpdatedAt(),
      };

      return CommandResult.success<ReturnRequestResult>(result);
    } catch (error) {
      if (error instanceof Error) {
        return CommandResult.failure<ReturnRequestResult>("Failed to create return request", [
          error.message,
        ]);
      }
      return CommandResult.failure<ReturnRequestResult>(
        "An unexpected error occurred while creating return request",
      );
    }
  }
}
