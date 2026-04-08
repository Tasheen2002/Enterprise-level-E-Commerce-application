import {
  AnalyticsTrackingService,
  TrackAddToCartDto,
} from "../services/analytics-tracking.service";
import {
  ICommand,
  ICommandHandler,
  CommandResult,
} from "./track-product-view.command";

export interface TrackAddToCartCommand extends ICommand {
  productId: string;
  variantId?: string;
  quantity: number;
  price: number;
  userId?: string;
  guestToken?: string;
  sessionId: string;
  userAgent?: string;
  ipAddress?: string;
  referrer?: string;
  context?: any;
}

export class TrackAddToCartHandler
  implements ICommandHandler<TrackAddToCartCommand, CommandResult<void>>
{
  constructor(
    private readonly analyticsTrackingService: AnalyticsTrackingService
  ) {}

  async handle(command: TrackAddToCartCommand): Promise<CommandResult<void>> {
    try {
      if (!command.productId) {
        return CommandResult.failure<void>("Product ID is required", [
          "productId",
        ]);
      }

      if (!command.quantity || command.quantity < 0) {
        return CommandResult.failure<void>("Valid quantity is required", [
          "quantity",
        ]);
      }

      if (command.price === undefined || command.price < 0) {
        return CommandResult.failure<void>("Valid price is required", [
          "price",
        ]);
      }

      if (!command.sessionId) {
        return CommandResult.failure<void>("Session ID is required", [
          "sessionId",
        ]);
      }

      if (!command.userId && !command.guestToken) {
        return CommandResult.failure<void>(
          "Either userId or guestToken is required",
          ["userId", "guestToken"]
        );
      }

      await this.analyticsTrackingService.trackAddToCart({
        productId: command.productId,
        variantId: command.variantId,
        quantity: command.quantity,
        price: command.price,
        userId: command.userId,
        guestToken: command.guestToken,
        sessionId: command.sessionId,
        userAgent: command.userAgent,
        ipAddress: command.ipAddress,
        referrer: command.referrer,
      });

      return CommandResult.success<void>();
    } catch (error) {
      if (error instanceof Error) {
        return CommandResult.failure<void>("Failed to track add to cart", [
          error.message,
        ]);
      }

      return CommandResult.failure<void>(
        "An unexpected error occurred while tracking add to cart"
      );
    }
  }
}
