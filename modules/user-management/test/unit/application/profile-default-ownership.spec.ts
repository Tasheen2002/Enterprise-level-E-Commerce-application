import { describe, expect, it, vi } from "vitest";
import { randomUUID } from "node:crypto";
import { UserProfileService } from "../../../application/services/user-profile.service";
import { User } from "../../../domain/entities/user.entity";
import { UserId } from "../../../domain/value-objects/user-id.vo";
import { InvalidOperationError } from "../../../domain/errors/user-management.errors";

// A profile is created on the first update; references to defaults must be
// ownership-checked on that path exactly as on later updates.
function harness(existingProfile: unknown) {
  const user = User.create({ email: `p-${randomUUID()}@example.test`, passwordHash: "hash" });
  const otherUser = UserId.fromString(randomUUID());
  const foreign = { belongsToUser: (id: UserId) => id.equals(otherUser) };
  const profiles = {
    findByUserId: vi.fn().mockResolvedValue(existingProfile),
    save: vi.fn(),
  };
  const service = new UserProfileService(
    { findById: vi.fn().mockResolvedValue(user), save: vi.fn() } as never,
    profiles as never,
    { findById: vi.fn().mockResolvedValue(foreign) } as never,
    { findById: vi.fn().mockResolvedValue(foreign) } as never,
  );
  return { service, user, profiles };
}

describe("profile default references", () => {
  it.each([
    ["address", { defaultAddressId: randomUUID() }],
    ["payment method", { defaultPaymentMethodId: randomUUID() }],
  ])(
    "refuses another user's %s when the profile is created on first update",
    async (_label, reference) => {
      const h = harness(null);
      await expect(
        h.service.updateUserProfile(h.user.id.getValue(), reference),
      ).rejects.toBeInstanceOf(InvalidOperationError);
      expect(h.profiles.save).not.toHaveBeenCalled();
    },
  );
});
