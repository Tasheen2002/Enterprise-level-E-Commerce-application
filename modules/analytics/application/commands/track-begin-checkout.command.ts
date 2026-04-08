import {
  AnalyticsTrackingService,
  TrackBeginCheckoutDto,
} from "../services/analytics-tracking.service";
import {
  ICommand,
  ICommandHandler,
  CommandResult,
} from "./track-product-view.command";

export interface TrackBeginCheckoutCommand extends ICommand {
  cartId: string;
  cartTotal: number;
  itemCount: number;
  currency: string;
  userId?: string;
  guestToken?: string;
  sessionId: string;
  userAgent?: string;
  ipAddress?: string;
  referrer?: string;
  context?: any;
}

export class TrackBeginCheckoutHandler
  implements ICommandHandler<TrackBeginCheckoutCommand, CommandResult<void>>
{
  constructor(
    private readonly analyticsTrackingService: AnalyticsTrackingService
  ) {}

  async handle(
    command: TrackBeginCheckoutCommand
  ): Promise<CommandResult<void>> {
    try {
      await this.analyticsTrackingService.trackBeginCheckout({
        cartId: command.cartId,
        cartTotal: command.cartTotal,
        itemCount: command.itemCount,
        currency: command.currency,
        sessionId: command.sessionId,
        guestToken: command.guestToken,
        userId: command.userId,
        userAgent: command.userAgent,
        ipAddress: command.ipAddress,
        referrer: command.referrer,
        context: command.context,
      });
      return CommandResult.success<void>();
    } catch (error) {
      console.error("Failed to track begin checkout:", error);
      // Silent failure
      return CommandResult.success<void>();
    }
  }
}
