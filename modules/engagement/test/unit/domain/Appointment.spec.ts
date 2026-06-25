import { describe, it, expect } from "vitest";
import {
  Appointment,
  AppointmentId,
  AppointmentType,
  DomainValidationError,
  AppointmentCreatedEvent,
  AppointmentRescheduledEvent
} from "@modules/engagement/domain";
import { AppointmentCancelledEvent } from "@modules/engagement/domain/entities/appointment.entity";

describe("Appointment Aggregate Root", () => {
  const getFutureDates = (startHoursAhead = 2, durationHours = 1) => {
    const start = new Date(Date.now() + startHoursAhead * 60 * 60 * 1000);
    const end = new Date(start.getTime() + durationHours * 60 * 60 * 1000);
    return { start, end };
  };

  it("should successfully create an appointment and emit AppointmentCreatedEvent", () => {
    const { start, end } = getFutureDates();
    const appointment = Appointment.create({
      userId: "user-789",
      type: AppointmentType.STYLIST,
      locationId: "loc-123",
      startAt: start,
      endAt: end,
      notes: "First fitting"
    });

    expect(appointment.id).toBeInstanceOf(AppointmentId);
    expect(appointment.userId).toBe("user-789");
    expect(appointment.type.equals(AppointmentType.STYLIST)).toBe(true);
    expect(appointment.locationId).toBe("loc-123");
    expect(appointment.startAt).toBe(start);
    expect(appointment.endAt).toBe(end);
    expect(appointment.notes).toBe("First fitting");

    const events = appointment.domainEvents;
    expect(events).toHaveLength(1);
    expect(events[0]).toBeInstanceOf(AppointmentCreatedEvent);
    expect((events[0] as AppointmentCreatedEvent).type).toBe("stylist");
  });

  it("should throw DomainValidationError if start time is equal or after end time", () => {
    const start = new Date(Date.now() + 2 * 60 * 60 * 1000);
    const end = new Date(start.getTime() - 1 * 60 * 60 * 1000);

    expect(() => {
      Appointment.create({
        userId: "user-789",
        type: AppointmentType.STYLIST,
        startAt: start,
        endAt: end
      });
    }).toThrow(DomainValidationError);
  });

  it("should throw DomainValidationError if start time is in the past", () => {
    const start = new Date(Date.now() - 1 * 60 * 60 * 1000);
    const end = new Date(start.getTime() + 1 * 60 * 60 * 1000);

    expect(() => {
      Appointment.create({
        userId: "user-789",
        type: AppointmentType.STYLIST,
        startAt: start,
        endAt: end
      });
    }).toThrow(DomainValidationError);
  });

  it("should throw DomainValidationError if user ID is empty", () => {
    const { start, end } = getFutureDates();
    expect(() => {
      Appointment.create({
        userId: "   ",
        type: AppointmentType.STYLIST,
        startAt: start,
        endAt: end
      });
    }).toThrow(DomainValidationError);
  });

  it("should support rescheduling and emit AppointmentRescheduledEvent", () => {
    const { start, end } = getFutureDates(2, 1);
    const appointment = Appointment.create({
      userId: "user-789",
      type: AppointmentType.STYLIST,
      startAt: start,
      endAt: end
    });

    const newStart = new Date(start.getTime() + 24 * 60 * 60 * 1000);
    const newEnd = new Date(newStart.getTime() + 2 * 60 * 60 * 1000);

    appointment.clearDomainEvents();
    appointment.reschedule(newStart, newEnd);

    expect(appointment.startAt).toBe(newStart);
    expect(appointment.endAt).toBe(newEnd);

    const events = appointment.domainEvents;
    expect(events).toHaveLength(1);
    expect(events[0]).toBeInstanceOf(AppointmentRescheduledEvent);
  });

  it("should support cancelling and emit AppointmentCancelledEvent", () => {
    const { start, end } = getFutureDates();
    const appointment = Appointment.create({
      userId: "user-789",
      type: AppointmentType.STYLIST,
      startAt: start,
      endAt: end
    });

    appointment.clearDomainEvents();
    appointment.cancel();

    const events = appointment.domainEvents;
    expect(events).toHaveLength(1);
    expect(events[0]).toBeInstanceOf(AppointmentCancelledEvent);
  });

  it("should support updating notes and location", () => {
    const { start, end } = getFutureDates();
    const appointment = Appointment.create({
      userId: "user-789",
      type: AppointmentType.STYLIST,
      startAt: start,
      endAt: end
    });

    appointment.updateNotes("Some notes");
    expect(appointment.notes).toBe("Some notes");

    appointment.updateLocation("loc-new");
    expect(appointment.locationId).toBe("loc-new");
  });

  it("should compute duration and check upcoming/past/ongoing states correctly", () => {
    const { start, end } = getFutureDates(2, 1.5);
    const appointment = Appointment.create({
      userId: "user-789",
      type: AppointmentType.STYLIST,
      startAt: start,
      endAt: end
    });

    expect(appointment.getDurationInMinutes()).toBe(90);
    expect(appointment.getDurationInHours()).toBe(1.5);
    expect(appointment.isUpcoming()).toBe(true);
    expect(appointment.isPast()).toBe(false);
    expect(appointment.isOngoing()).toBe(false);
  });

  it("should detect overlapping conflicts between appointments", () => {
    const baseStart = new Date(Date.now() + 5 * 60 * 60 * 1000);
    const baseEnd = new Date(baseStart.getTime() + 2 * 60 * 60 * 1000);

    const baseAppt = Appointment.create({
      userId: "user-1",
      type: AppointmentType.STYLIST,
      startAt: baseStart,
      endAt: baseEnd
    });

    // 1. Completely overlapping
    const overlapAppt = Appointment.create({
      userId: "user-2",
      type: AppointmentType.STYLIST,
      startAt: new Date(baseStart.getTime() + 30 * 60 * 1000),
      endAt: new Date(baseStart.getTime() + 90 * 60 * 1000)
    });
    expect(baseAppt.conflictsWith(overlapAppt)).toBe(true);

    // 2. Starts before, ends during
    const earlyAppt = Appointment.create({
      userId: "user-3",
      type: AppointmentType.STYLIST,
      startAt: new Date(baseStart.getTime() - 60 * 60 * 1000),
      endAt: new Date(baseStart.getTime() + 30 * 60 * 1000)
    });
    expect(baseAppt.conflictsWith(earlyAppt)).toBe(true);

    // 3. Starts during, ends after
    const lateAppt = Appointment.create({
      userId: "user-4",
      type: AppointmentType.STYLIST,
      startAt: new Date(baseStart.getTime() + 60 * 60 * 1000),
      endAt: new Date(baseEnd.getTime() + 60 * 60 * 1000)
    });
    expect(baseAppt.conflictsWith(lateAppt)).toBe(true);

    // 4. Completely outside (no conflict)
    const separateAppt = Appointment.create({
      userId: "user-5",
      type: AppointmentType.STYLIST,
      startAt: new Date(baseEnd.getTime() + 10 * 60 * 1000),
      endAt: new Date(baseEnd.getTime() + 60 * 60 * 1000)
    });
    expect(baseAppt.conflictsWith(separateAppt)).toBe(false);
  });
});
