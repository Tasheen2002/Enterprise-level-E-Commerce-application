import { CustomerFeedbackService } from "../services/customer-feedback.service.js";

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

export interface AddCustomerFeedbackCommand extends ICommand {
  userId?: string;
  ticketId?: string;
  orderId?: string;
  npsScore?: number;
  csatScore?: number;
  comment?: string;
}

export interface CustomerFeedbackResult {
  feedbackId: string;
  userId?: string;
  ticketId?: string;
  orderId?: string;
  npsScore?: number;
  csatScore?: number;
  comment?: string;
  createdAt: Date;
}

export class AddCustomerFeedbackHandler
  implements
    ICommandHandler<
      AddCustomerFeedbackCommand,
      CommandResult<CustomerFeedbackResult>
    >
{
  constructor(private readonly feedbackService: CustomerFeedbackService) {}

  async handle(
    command: AddCustomerFeedbackCommand
  ): Promise<CommandResult<CustomerFeedbackResult>> {
    try {
      if (
        command.npsScore === undefined &&
        command.csatScore === undefined &&
        !command.comment
      ) {
        return CommandResult.failure<CustomerFeedbackResult>(
          "At least one of NPS score, CSAT score, or comment must be provided",
          ["npsScore", "csatScore", "comment"]
        );
      }

      const feedback = await this.feedbackService.createFeedback({
        userId: command.userId,
        ticketId: command.ticketId,
        orderId: command.orderId,
        npsScore: command.npsScore,
        csatScore: command.csatScore,
        comment: command.comment,
      });

      const result: CustomerFeedbackResult = {
        feedbackId: feedback.getFeedbackId().getValue(),
        userId: feedback.getUserId(),
        ticketId: feedback.getTicketId(),
        orderId: feedback.getOrderId(),
        npsScore: feedback.getNpsScore(),
        csatScore: feedback.getCsatScore(),
        comment: feedback.getComment(),
        createdAt: feedback.getCreatedAt(),
      };

      return CommandResult.success<CustomerFeedbackResult>(result);
    } catch (error) {
      if (error instanceof Error) {
        return CommandResult.failure<CustomerFeedbackResult>(
          "Failed to add customer feedback",
          [error.message]
        );
      }

      return CommandResult.failure<CustomerFeedbackResult>(
        "An unexpected error occurred while adding customer feedback"
      );
    }
  }
}
