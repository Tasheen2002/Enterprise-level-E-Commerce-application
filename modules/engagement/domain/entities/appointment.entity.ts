import {
  AppointmentId,
  AppointmentType,
} from "../value-objects/index.js";

export interface CreateAppointmentData {
  userId: string;
  type: AppointmentType;
  locationId?: string;
  startAt: Date;
  endAt: Date;
  notes?: string;
}

export interface AppointmentEntityData {
  apptId: string;
  userId: string;
  type: AppointmentType;
  locationId?: string;
  startAt: Date;
  endAt: Date;
  notes?: string;
}

export interface AppointmentDatabaseRow {
  appt_id: string;
  user_id: string;
  type: string;
  location_id: string | null;
  start_at: Date;
  end_at: Date;
  notes: string | null;
}

export class Appointment {
  private constructor(
    private readonly apptId: AppointmentId,
    private readonly userId: string,
    private readonly type: AppointmentType,
    private startAt: Date,
    private endAt: Date,
    private locationId?: string,
    private notes?: string
  ) {}

  // Factory methods
  static create(data: CreateAppointmentData): Appointment {
    const apptId = AppointmentId.create();

    if (!data.userId) {
      throw new Error("User ID is required");
    }

    if (!data.startAt) {
      throw new Error("Start time is required");
    }

    if (!data.endAt) {
      throw new Error("End time is required");
    }

    if (data.startAt >= data.endAt) {
      throw new Error("End time must be after start time");
    }

    if (data.startAt < new Date()) {
      throw new Error("Start time cannot be in the past");
    }

    return new Appointment(
      apptId,
      data.userId,
      data.type,
      data.startAt,
      data.endAt,
      data.locationId,
      data.notes
    );
  }

  static reconstitute(data: AppointmentEntityData): Appointment {
    const apptId = AppointmentId.fromString(data.apptId);

    return new Appointment(
      apptId,
      data.userId,
      data.type,
      data.startAt,
      data.endAt,
      data.locationId,
      data.notes
    );
  }

  static fromDatabaseRow(row: AppointmentDatabaseRow): Appointment {
    return new Appointment(
      AppointmentId.fromString(row.appt_id),
      row.user_id,
      AppointmentType.fromString(row.type),
      row.start_at,
      row.end_at,
      row.location_id || undefined,
      row.notes || undefined
    );
  }

  // Getters
  getApptId(): AppointmentId {
    return this.apptId;
  }

  getUserId(): string {
    return this.userId;
  }

  getType(): AppointmentType {
    return this.type;
  }

  getLocationId(): string | undefined {
    return this.locationId;
  }

  getStartAt(): Date {
    return this.startAt;
  }

  getEndAt(): Date {
    return this.endAt;
  }

  getNotes(): string | undefined {
    return this.notes;
  }

  // Business methods
  reschedule(startAt: Date, endAt: Date): void {
    if (startAt >= endAt) {
      throw new Error("End time must be after start time");
    }

    if (startAt < new Date()) {
      throw new Error("Cannot reschedule to a past time");
    }

    this.startAt = startAt;
    this.endAt = endAt;
  }

  updateNotes(notes?: string): void {
    this.notes = notes?.trim();
  }

  updateLocation(locationId?: string): void {
    this.locationId = locationId;
  }

  // Helper methods
  getDuration(): number {
    return this.endAt.getTime() - this.startAt.getTime();
  }

  getDurationInMinutes(): number {
    return this.getDuration() / (1000 * 60);
  }

  getDurationInHours(): number {
    return this.getDuration() / (1000 * 60 * 60);
  }

  isPast(): boolean {
    return this.endAt < new Date();
  }

  isUpcoming(): boolean {
    return this.startAt > new Date();
  }

  isOngoing(): boolean {
    const now = new Date();
    return this.startAt <= now && this.endAt >= now;
  }

  isStylistAppointment(): boolean {
    return this.type.isStylist();
  }

  isInStoreAppointment(): boolean {
    return this.type.isInStore();
  }

  conflictsWith(other: Appointment): boolean {
    return (
      (this.startAt >= other.startAt && this.startAt < other.endAt) ||
      (this.endAt > other.startAt && this.endAt <= other.endAt) ||
      (this.startAt <= other.startAt && this.endAt >= other.endAt)
    );
  }

  // Convert to data for persistence
  toData(): AppointmentEntityData {
    return {
      apptId: this.apptId.getValue(),
      userId: this.userId,
      type: this.type,
      locationId: this.locationId,
      startAt: this.startAt,
      endAt: this.endAt,
      notes: this.notes,
    };
  }

  toDatabaseRow(): AppointmentDatabaseRow {
    return {
      appt_id: this.apptId.getValue(),
      user_id: this.userId,
      type: this.type.getValue(),
      location_id: this.locationId || null,
      start_at: this.startAt,
      end_at: this.endAt,
      notes: this.notes || null,
    };
  }

  equals(other: Appointment): boolean {
    return this.apptId.equals(other.apptId);
  }
}
