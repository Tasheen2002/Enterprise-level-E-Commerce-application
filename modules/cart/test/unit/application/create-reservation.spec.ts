import { describe, it, expect, vi } from "vitest";
import { CreateReservationHandler, CreateReservationCommand } from "@modules/cart/application/commands/create-reservation.command";
import { ReservationService, ReservationDTO } from "@modules/cart/application/services/reservation.service";
import { CommandResult } from "@packages/core/src/application/cqrs";

describe("CreateReservationHandler", () => {
  it("should successfully create a reservation using ReservationService", async () => {
    // Arrange
    const mockReservationDto: ReservationDTO = {
      reservationId: "res-123",
      cartId: "cart-123",
      variantId: "variant-999",
      quantity: 5,
      expiresAt: new Date().toISOString(),
      status: "active",
      isExpired: false,
      isExpiringSoon: false,
      timeUntilExpirySeconds: 900,
      canBeExtended: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const mockService = {
      createReservation: vi.fn().mockResolvedValue(mockReservationDto),
    } as unknown as ReservationService;

    const handler = new CreateReservationHandler(mockService);

    const command: CreateReservationCommand = {
      cartId: "cart-123",
      variantId: "variant-999",
      quantity: 5,
      durationMinutes: 15,
    };

    // Act
    const result = await handler.handle(command);

    // Assert
    expect(mockService.createReservation).toHaveBeenCalledWith({
      cartId: "cart-123",
      variantId: "variant-999",
      quantity: 5,
      durationMinutes: 15,
    });
    expect(result).toBeInstanceOf(CommandResult);
    expect(result.success).toBe(true);
    expect(result.data).toEqual(mockReservationDto);
  });
});
