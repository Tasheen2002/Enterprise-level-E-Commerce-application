import { describe, it, expect, vi } from "vitest";
import { UpdateProfileHandler, UpdateProfileCommand } from "@modules/user-management/application/commands/update-profile.command";
import { UserProfileService, UserProfileViewDTO } from "@modules/user-management/application/services/user-profile.service";
import { CommandResult } from "@packages/core/src/application/cqrs";

describe("UpdateProfileHandler", () => {
  it("should successfully update user profile details using UserProfileService", async () => {
    // Arrange
    const mockProfile: UserProfileViewDTO = {
      userId: "user-123",
      defaultAddressId: null,
      defaultPaymentMethodId: null,
      avatarUrl: "http://example.com/avatar.jpg",
      locale: "en-US",
      currency: "USD",
      firstName: "Jane",
      lastName: "Doe",
      phone: "+1234567890",
      title: "Ms.",
      dateOfBirth: "1995-05-15",
      residentOf: "US",
      nationality: "American",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      stylePreferences: {
        preferredColors: ["blue"],
        styles: ["casual"],
        fits: ["regular"],
      },
      preferredSizes: {
        footwear: "8.5",
        top: "M",
        bottom: "32",
      },
      preferences: {
        emailNotifications: true,
        smsNotifications: false,
        whatsappNotifications: false,
      },
    };

    const mockService = {
      updateUserProfile: vi.fn().mockResolvedValue(mockProfile),
    } as unknown as UserProfileService;

    const handler = new UpdateProfileHandler(mockService);

    const command: UpdateProfileCommand = {
      userId: "user-123",
      firstName: "Jane",
      lastName: "Doe",
      phone: "+1234567890",
      avatarUrl: "http://example.com/avatar.jpg",
      locale: "en-US",
      currency: "USD",
      title: "Ms.",
      dateOfBirth: "1995-05-15",
      residentOf: "US",
      nationality: "American",
      stylePreferences: {
        preferredColors: ["blue"],
        styles: ["casual"],
        fits: ["regular"],
      },
      preferredSizes: {
        footwear: "8.5",
        top: "M",
        bottom: "32",
      },
    };

    // Act
    const result = await handler.handle(command);

    // Assert
    expect(mockService.updateUserProfile).toHaveBeenCalledWith("user-123", {
      defaultAddressId: undefined,
      defaultPaymentMethodId: undefined,
      avatarUrl: "http://example.com/avatar.jpg",
      prefs: undefined,
      locale: "en-US",
      currency: "USD",
      stylePreferences: {
        preferredColors: ["blue"],
        styles: ["casual"],
        fits: ["regular"],
      },
      preferredSizes: {
        footwear: "8.5",
        top: "M",
        bottom: "32",
      },
      firstName: "Jane",
      lastName: "Doe",
      phone: "+1234567890",
      title: "Ms.",
      dateOfBirth: "1995-05-15",
      residentOf: "US",
      nationality: "American",
    });
    expect(result).toBeInstanceOf(CommandResult);
    expect(result.success).toBe(true);
    expect(result.data).toEqual(mockProfile);
  });
});
