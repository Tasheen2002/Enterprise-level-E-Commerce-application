import { ICommand, ICommandHandler } from "./track-product-view.command";
import { CommandResult } from "./track-product-view.command";
import { AnalyticsTrackingService } from "../services/analytics-tracking.service";

export interface TrackAddPaymentInfoCommand extends ICommand {
  cartId: string;
  paymentMethod: string; // e.g., "Credit Card", "PayPal"
  cartTotal: number;
  itemCount: number;
  currency: string;
  sessionId: string;
  userId?: string;
  guestToken?: string;
  userAgent?: string;
  ipAddress?: string;
  referrer?: string;
  context?: any;
}

export class TrackAddPaymentInfoHandler
  implements ICommandHandler<TrackAddPaymentInfoCommand, CommandResult<void>>
{
  constructor(
    private readonly analyticsTrackingService: AnalyticsTrackingService
  ) {}

  async handle(
    command: TrackAddPaymentInfoCommand
  ): Promise<CommandResult<void>> {
    try {
      await this.analyticsTrackingService.trackAddPaymentInfo({
        cartId: command.cartId,
        paymentMethod: command.paymentMethod,
        cartTotal: command.cartTotal,
        itemCount: command.itemCount,
        currency: command.currency,
        sessionId: command.sessionId,
        userId: command.userId,
        guestToken: command.guestToken,
        context: command.context,
      });

      return CommandResult.success<void>();
    } catch (error) {
      console.error("Failed to track add payment info:", error);
      // Silent failure
      return CommandResult.success<void>();
    }
  }
}
