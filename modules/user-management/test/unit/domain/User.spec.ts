import { describe, it, expect } from "vitest";
import { User } from "@modules/user-management/domain/entities/user.entity";
import { UserRole } from "@modules/user-management/domain/value-objects/user-role.vo";
import { UserStatus } from "@modules/user-management/domain/value-objects/user-status.vo";
import {
  InvalidPasswordError,
} from "@modules/user-management/domain/errors/user-management.errors";
import {
  UserEmailChangedEvent,
  UserEmailVerifiedEvent,
  UserPhoneVerifiedEvent,
  UserPasswordChangedEvent,
  UserTwoFactorEnabledEvent,
  UserTwoFactorDisabledEvent,
} from "@modules/user-management/domain/entities/user.entity";

describe("User Aggregate Root", () => {
  it("should create a standard customer user successfully", () => {
    const user = User.create({
      email: "customer@example.com",
      passwordHash: "secure-hash-123",
      firstName: "John",
      lastName: "Doe",
    });

    expect(user.id).toBeDefined();
    expect(user.email.getValue()).toBe("customer@example.com");
    expect(user.passwordHash).toBe("secure-hash-123");
    expect(user.firstName).toBe("John");
    expect(user.lastName).toBe("Doe");
    expect(user.role).toBe(UserRole.CUSTOMER);
    expect(user.status).toBe(UserStatus.ACTIVE);
    expect(user.emailVerified).toBe(false);
    expect(user.phoneVerified).toBe(false);
    expect(user.twoFactorEnabled).toBe(false);
    expect(user.isGuest).toBe(false);

    // Verify UserRegisteredEvent is in the domain events list
    const events = user.domainEvents;
    expect(events.length).toBe(1);
    expect(events[0].eventType).toBe("user.registered");
  });

  it("should create a guest user successfully without a password hash", () => {
    const user = User.createGuest();

    expect(user.id).toBeDefined();
    expect(user.email.getValue()).toContain("guest-");
    expect(user.passwordHash).toBe("");
    expect(user.role).toBe(UserRole.GUEST);
    expect(user.status).toBe(UserStatus.ACTIVE);
    expect(user.isGuest).toBe(true);

    // Guest creation should not record a UserRegisteredEvent
    expect(user.domainEvents.length).toBe(0);
  });

  it("should throw InvalidPasswordError when creating standard user with empty password hash", () => {
    expect(() =>
      User.create({
        email: "customer@example.com",
        passwordHash: "",
        firstName: "John",
        lastName: "Doe",
      })
    ).toThrow(InvalidPasswordError);
  });

  it("should throw an error for invalid email formats on creation", () => {
    expect(() =>
      User.create({
        email: "invalid-email",
        passwordHash: "hash",
      })
    ).toThrow();
  });

  it("should throw an error if first name or last name is empty", () => {
    expect(() =>
      User.create({
        email: "customer@example.com",
        passwordHash: "hash",
        firstName: "  ",
        lastName: "Doe",
      })
    ).toThrow();

    expect(() =>
      User.create({
        email: "customer@example.com",
        passwordHash: "hash",
        firstName: "John",
        lastName: "",
      })
    ).toThrow();
  });

  it("should throw an error if names exceed max length", () => {
    const longName = "A".repeat(51); // Max is 50
    expect(() =>
      User.create({
        email: "customer@example.com",
        passwordHash: "hash",
        firstName: longName,
        lastName: "Doe",
      })
    ).toThrow();
  });

  it("should update email, reset verification status, and record event", () => {
    const user = User.create({
      email: "first@example.com",
      passwordHash: "hash",
    });

    user.setEmailVerified(true);
    user.clearDomainEvents(); // Clear registration and verification events

    user.updateEmail("second@example.com");

    expect(user.email.getValue()).toBe("second@example.com");
    expect(user.emailVerified).toBe(false);

    const events = user.domainEvents;
    expect(events.length).toBe(1);
    expect(events[0]).toBeInstanceOf(UserEmailChangedEvent);
    expect(events[0].getPayload()).toEqual({
      userId: user.id.getValue(),
      newEmail: "second@example.com",
    });
  });

  it("should not record email changed event if email is the same", () => {
    const user = User.create({
      email: "same@example.com",
      passwordHash: "hash",
    });
    user.clearDomainEvents();

    user.updateEmail("same@example.com");
    expect(user.domainEvents.length).toBe(0);
  });

  it("should set email verified and emit verified event", () => {
    const user = User.create({
      email: "test@example.com",
      passwordHash: "hash",
    });
    user.clearDomainEvents();

    user.setEmailVerified(true);

    expect(user.emailVerified).toBe(true);
    const events = user.domainEvents;
    expect(events.length).toBe(1);
    expect(events[0]).toBeInstanceOf(UserEmailVerifiedEvent);
  });

  it("should set phone verified, update number, and emit verified event", () => {
    const user = User.create({
      email: "test@example.com",
      passwordHash: "hash",
    });
    user.clearDomainEvents();

    user.updatePhone("+15555555555");
    user.clearDomainEvents();

    user.verifyPhone();

    expect(user.phoneVerified).toBe(true);
    expect(user.phone?.getValue()).toBe("+15555555555");

    const events = user.domainEvents;
    expect(events.length).toBe(1);
    expect(events[0]).toBeInstanceOf(UserPhoneVerifiedEvent);
  });

  it("should enable and disable 2FA, recording appropriate events", () => {
    const user = User.create({
      email: "test@example.com",
      passwordHash: "hash",
    });
    user.clearDomainEvents();

    // Setup secret
    user.beginTwoFactorSetup("MOCKSECRET32");
    expect(user.twoFactorSecret).toBe("MOCKSECRET32");
    expect(user.twoFactorEnabled).toBe(false);

    // Enable
    user.confirmTwoFactorEnable();
    expect(user.twoFactorEnabled).toBe(true);
    let events = user.domainEvents;
    expect(events.length).toBe(1);
    expect(events[0]).toBeInstanceOf(UserTwoFactorEnabledEvent);

    user.clearDomainEvents();

    // Disable
    user.disableTwoFactor();
    expect(user.twoFactorEnabled).toBe(false);
    expect(user.twoFactorSecret).toBeNull();
    events = user.domainEvents;
    expect(events.length).toBe(1);
    expect(events[0]).toBeInstanceOf(UserTwoFactorDisabledEvent);
  });

  it("should change password hash and record password changed event", () => {
    const user = User.create({
      email: "test@example.com",
      passwordHash: "old-hash",
    });
    user.clearDomainEvents();

    user.updatePassword("new-hash");

    expect(user.passwordHash).toBe("new-hash");
    const events = user.domainEvents;
    expect(events.length).toBe(1);
    expect(events[0]).toBeInstanceOf(UserPasswordChangedEvent);
  });
});
