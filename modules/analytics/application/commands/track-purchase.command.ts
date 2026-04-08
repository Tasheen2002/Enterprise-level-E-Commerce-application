import {
  AnalyticsTrackingService,
  TrackPurchaseDto,
} from '../services/analytics-tracking.service';
import { ICommand, ICommandHandler, CommandResult } from './track-product-view.command';

export interface TrackPurchaseCommand extends ICommand {
  orderId: string;
  orderItems: Array<{
    productId: string;
    variantId?: string;
    quantity: number;
    price: number;
  }>;
  userId?: string;
  guestToken?: string;
  sessionId: string;
  userAgent?: string;
  ipAddress?: string;
  totalAmount: number;
}

export class TrackPurchaseHandler
  implements ICommandHandler<TrackPurchaseCommand, CommandResult<void>>
{
  constructor(
    private readonly analyticsTrackingService: AnalyticsTrackingService
  ) {}

  async handle(command: TrackPurchaseCommand): Promise<CommandResult<void>> {
    try {
      if (!command.orderId) {
        return CommandResult.failure<void>('Order ID is required', ['orderId']);
      }

      if (!command.orderItems || command.orderItems.length === 0) {
        return CommandResult.failure<void>(
          'Order must have at least one item',
          ['orderItems']
        );
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

      await this.analyticsTrackingService.trackPurchase({
        orderId: command.orderId,
        orderItems: command.orderItems,
        userId: command.userId,
        guestToken: command.guestToken,
        sessionId: command.sessionId,
        userAgent: command.userAgent,
        ipAddress: command.ipAddress,
        totalAmount: command.totalAmount,
      });

      return CommandResult.success<void>();
    } catch (error) {
      if (error instanceof Error) {
        return CommandResult.failure<void>('Failed to track purchase', [
          error.message,
        ]);
      }

      return CommandResult.failure<void>(
        'An unexpected error occurred while tracking purchase'
      );
    }
  }
}
