import {
  AnalyticsTrackingService,
  TrackProductViewDto,
} from '../services/analytics-tracking.service';

// Base interfaces (shared pattern from cart module)
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

export interface TrackProductViewCommand extends ICommand {
  productId: string;
  variantId?: string;
  userId?: string;
  guestToken?: string;
  sessionId: string;
  userAgent?: string;
  ipAddress?: string;
  referrer?: string;
  context?: {
    source?: 'search' | 'category' | 'recommendation' | 'direct';
    searchQuery?: string;
    categoryId?: string;
  };
}

export class TrackProductViewHandler
  implements ICommandHandler<TrackProductViewCommand, CommandResult<void>>
{
  constructor(
    private readonly analyticsTrackingService: AnalyticsTrackingService
  ) {}

  async handle(
    command: TrackProductViewCommand
  ): Promise<CommandResult<void>> {
    try {
      // Validation
      if (!command.productId) {
        return CommandResult.failure<void>('Product ID is required', [
          'productId',
        ]);
      }

      if (!command.sessionId) {
        return CommandResult.failure<void>('Session ID is required', [
          'sessionId',
        ]);
      }

      if (!command.userId && !command.guestToken) {
        return CommandResult.failure<void>(
          'Either userId or guestToken is required',
          ['userId', 'guestToken']
        );
      }

      // Track product view
      await this.analyticsTrackingService.trackProductView({
        productId: command.productId,
        variantId: command.variantId,
        userId: command.userId,
        guestToken: command.guestToken,
        sessionId: command.sessionId,
        userAgent: command.userAgent,
        ipAddress: command.ipAddress,
        referrer: command.referrer,
        context: command.context,
      });

      return CommandResult.success<void>();
    } catch (error) {
      if (error instanceof Error) {
        return CommandResult.failure<void>('Failed to track product view', [
          error.message,
        ]);
      }

      return CommandResult.failure<void>(
        'An unexpected error occurred while tracking product view'
      );
    }
  }
}
