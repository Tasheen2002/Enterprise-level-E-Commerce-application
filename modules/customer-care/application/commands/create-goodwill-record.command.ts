import {
  type ICommand,
  type ICommandHandler,
  CommandResult,
} from "../../../../packages/core/src/application/cqrs";
import { GoodwillRecordService } from "../services/goodwill-record.service.js";
import { GoodwillType, Money } from "../../domain/value-objects/index.js";

export interface CreateGoodwillRecordCommand extends ICommand {
  userId?: string;
  orderId?: string;
  type: string;
  value: number;
  currency?: string;
  reason?: string;
}

export interface GoodwillRecordResult {
  goodwillId: string;
  userId?: string;
  orderId?: string;
  type: string;
  value: number;
  currency: string;
  reason?: string;
  createdAt: Date;
}

export class CreateGoodwillRecordHandler
  implements ICommandHandler<CreateGoodwillRecordCommand, CommandResult<GoodwillRecordResult>>
{
  constructor(private readonly goodwillService: GoodwillRecordService) {}

  async handle(command: CreateGoodwillRecordCommand): Promise<CommandResult<GoodwillRecordResult>> {
    try {
      if (!command.type) {
        return CommandResult.failure<GoodwillRecordResult>("Type is required", ["type"]);
      }
      if (!command.value || command.value <= 0) {
        return CommandResult.failure<GoodwillRecordResult>("Value must be greater than zero", [
          "value",
        ]);
      }

      const record = await this.goodwillService.createRecord({
        userId: command.userId,
        orderId: command.orderId,
        type: GoodwillType.fromString(command.type),
        value: Money.create(command.value, command.currency),
        reason: command.reason,
      });

      const result: GoodwillRecordResult = {
        goodwillId: record.getGoodwillId().getValue(),
        userId: record.getUserId(),
        orderId: record.getOrderId(),
        type: record.getType().getValue(),
        value: record.getValue().getAmount(),
        currency: record.getValue().getCurrency(),
        reason: record.getReason(),
        createdAt: record.getCreatedAt(),
      };

      return CommandResult.success<GoodwillRecordResult>(result);
    } catch (error) {
      if (error instanceof Error) {
        return CommandResult.failure<GoodwillRecordResult>("Failed to create goodwill record", [
          error.message,
        ]);
      }

      return CommandResult.failure<GoodwillRecordResult>(
        "An unexpected error occurred while creating goodwill record",
      );
    }
  }
}
