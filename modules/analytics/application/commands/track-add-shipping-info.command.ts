import { ICommand, ICommandHandler } from "./track-product-view.command";
import { CommandResult } from "./track-product-view.command";
import { AnalyticsTrackingService } from "../services/analytics-tracking.service";

// Define DTO locally to avoid circular dependencies or external complex types
export interface TrackAddShippingInfoDto {
  cartId: string;
  shippingMethod: string; // e.g., "Home Delivery", "Store Pickup"
  shippingTier: string; // e.g., "Standard", "Express"
  cartTotal: number;
  itemCount: number;
  sessionId: string;
  currency: string;
  userId?: string;
  guestToken?: string;
  userAgent?: string;
  ipAddress?: string;
  referrer?: string;
  context?: any;
}

export interface TrackAddShippingInfoCommand extends ICommand {
  cartId: string;
  shippingMethod: string;
  shippingTier: string;
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

export class TrackAddShippingInfoHandler
  implements ICommandHandler<TrackAddShippingInfoCommand, CommandResult<void>>
{
  constructor(
    private readonly analyticsTrackingService: AnalyticsTrackingService
  ) {}

  async handle(
    command: TrackAddShippingInfoCommand
  ): Promise<CommandResult<void>> {
    try {
      // Map command to DTO expected by service (if separate, otherwise pass direct params)
      // Since service method doesn't exist yet, we'll implement it shortly.
      // For now, we assume a method signature similar to others.
      await this.analyticsTrackingService.trackAddShippingInfo({
        cartId: command.cartId,
        shippingMethod: command.shippingMethod,
        shippingTier: command.shippingTier,
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
      console.error("Failed to track add shipping info:", error);
      // Silent failure
      return CommandResult.success<void>();
    }
  }
}
