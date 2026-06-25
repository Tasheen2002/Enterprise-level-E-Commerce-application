import { describe, it, expect, vi } from "vitest";
import { TrackBeginCheckoutHandler, TrackBeginCheckoutCommand } from "@modules/analytics/application/commands/track-begin-checkout.command";
import { AnalyticsTrackingService } from "@modules/analytics/application/services/analytics-tracking.service";
import { CommandResult } from "@modules/analytics/application/commands/track-product-view.command";

describe("TrackBeginCheckoutHandler", () => {
  it("should successfully track begin checkout using AnalyticsTrackingService", async () => {
    // Arrange
    const mockService = {
      trackBeginCheckout: vi.fn().mockResolvedValue(undefined),
    } as unknown as AnalyticsTrackingService;

    const handler = new TrackBeginCheckoutHandler(mockService);

    const command: TrackBeginCheckoutCommand = {
      cartId: "cart-123",
      cartTotal: 150.5,
      itemCount: 3,
      currency: "USD",
      sessionId: "session-123",
      userId: "user-123",
      guestToken: "guest-123",
      userAgent: "Mozilla/5.0",
      ipAddress: "127.0.0.1",
      referrer: "http://google.com",
    };

    // Act
    const result = await handler.handle(command);

    // Assert
    expect(mockService.trackBeginCheckout).toHaveBeenCalledWith({
      cartId: "cart-123",
      cartTotal: 150.5,
      itemCount: 3,
      currency: "USD",
      sessionId: "session-123",
      userId: "user-123",
      guestToken: "guest-123",
      userAgent: "Mozilla/5.0",
      ipAddress: "127.0.0.1",
      referrer: "http://google.com",
      context: undefined,
    });
    expect(result).toBeInstanceOf(CommandResult);
    expect(result.success).toBe(true);
  });

  it("should fail silently and return success: true even if service throws error", async () => {
    const mockService = {
      trackBeginCheckout: vi.fn().mockRejectedValue(new Error("Db connection failed")),
    } as unknown as AnalyticsTrackingService;

    const handler = new TrackBeginCheckoutHandler(mockService);
    const command = { cartId: "cart-123" } as unknown as TrackBeginCheckoutCommand;

    const result = await handler.handle(command);

    expect(result.success).toBe(true); // Silent failure behavior
  });
});
