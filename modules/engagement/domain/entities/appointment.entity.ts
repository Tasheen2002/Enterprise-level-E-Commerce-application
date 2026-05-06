import { AggregateRoot } from "../../../../packages/core/src/domain/aggregate-root";
import { DomainEvent } from "../../../../packages/core/src/domain/events/domain-event";
import { AppointmentId, AppointmentType } from "../value-objects";
import { DomainValidationError } from "../errors/engagement.errors";

// ============================================================================
// 2. Domain Events
// ============================================================================
export class AppointmentCreatedEvent extends DomainEvent {
  constructor(
    public readonly appointmentId: string,
    public readonly userId: string,
    public readonly type: string,
    public readonly startAt: string,
    public readonly endAt: string,
  ) {
    super(appointmentId, "Appointment");
  }

  get eventType(): string {
    return "appointment.created";
  }

  getPayload(): Record<string, unknown> {
    return {
      appointmentId: this.appointmentId,
      userId: this.userId,
      type: this.type,
      startAt: this.startAt,
      endAt: this.endAt,
    };
  }
}

export class AppointmentRescheduledEvent extends DomainEvent {
  constructor(
    public readonly appointmentId: string,
    public readonly oldStartAt: string,
    public readonly oldEndAt: string,
    public readonly newStartAt: string,
    public readonly newEndAt: string,
  ) {
    super(appointmentId, "Appointment");
  }

  get eventType(): string {
    return "appointment.rescheduled";
  }

  getPayload(): Record<string, unknown> {
    return {
      appointmentId: this.appointmentId,
      oldStartAt: this.oldStartAt,
      oldEndAt: this.oldEndAt,
      newStartAt: this.newStartAt,
      newEndAt: this.newEndAt,
    };
  }
}

export class AppointmentCancelledEvent extends DomainEvent {
  constructor(
    public readonly appointmentId: string,
    public readonly userId: string,
    public readonly cancelledAt: string,
  ) {
    super(appointmentId, "Appointment");
  }

  get eventType(): string {
    return "appointment.cancelled";
  }

  getPayload(): Record<string, unknown> {
    return {
      appointmentId: this.appointmentId,
      userId: this.userId,
      cancelledAt: this.cancelledAt,
    };
  }
}

// ============================================================================
// 3. Props Interface
// ============================================================================
export interface AppointmentProps {
  id: AppointmentId;
  userId: string;
  type: AppointmentType;
  startAt: Date;
  endAt: Date;
  locationId?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// 4. DTO Interface
// ============================================================================
export interface AppointmentDTO {
  id: string;
  userId: string;
  type: string;
  startAt: string;
  endAt: string;
  locationId?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// 5. Entity Class
// ============================================================================
export class Appointment extends AggregateRoot {
  private constructor(private props: AppointmentProps) {
    super();
  }

  static create(
    params: Omit<AppointmentProps, "id" | "createdAt" | "updatedAt">,
  ): Appointment {
    Appointment.validateTimes(params.startAt, params.endAt);
    Appointment.validateUserId(params.userId);

    const entity = new Appointment({
      ...params,
      id: AppointmentId.create(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    entity.addDomainEvent(
      new AppointmentCreatedEvent(
        entity.props.id.getValue(),
        entity.props.userId,
        entity.props.type.getValue(),
        entity.props.startAt.toISOString(),
        entity.props.endAt.toISOString(),
      ),
    );

    return entity;
  }

  static fromPersistence(props: AppointmentProps): Appointment {
    return new Appointment(props);
  }

  private static validateTimes(
    startAt: Date,
    endAt: Date,
    allowPast = false,
  ): void {
    if (startAt >= endAt) {
      throw new DomainValidationError("End time must be after start time");
    }
    if (!allowPast && startAt < new Date()) {
      throw new DomainValidationError("Start time cannot be in the past");
    }
  }

  private static validateUserId(userId: string): void {
    if (!userId || userId.trim().length === 0) {
      throw new DomainValidationError("User ID is required");
    }
  }

  // Getters
  get id(): AppointmentId {
    return this.props.id;
  }
  get userId(): string {
    return this.props.userId;
  }
  get type(): AppointmentType {
    return this.props.type;
  }
  get startAt(): Date {
    return this.props.startAt;
  }
  get endAt(): Date {
    return this.props.endAt;
  }
  get locationId(): string | undefined {
    return this.props.locationId;
  }
  get notes(): string | undefined {
    return this.props.notes;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  // Business methods
  reschedule(startAt: Date, endAt: Date): void {
    Appointment.validateTimes(startAt, endAt, true);

    const oldStartAt = this.props.startAt.toISOString();
    const oldEndAt = this.props.endAt.toISOString();

    this.props.startAt = startAt;
    this.props.endAt = endAt;
    this.props.updatedAt = new Date();

    this.addDomainEvent(
      new AppointmentRescheduledEvent(
        this.props.id.getValue(),
        oldStartAt,
        oldEndAt,
        startAt.toISOString(),
        endAt.toISOString(),
      ),
    );
  }

  // Marks the appointment as cancelled by emitting the cancellation event,
  // touching `updatedAt`, and letting the caller persist + delete (the
  // service deletes the row after `save` so subscribers see the event).
  // We don't track a `cancelled` status field — cancellation is terminal
  // and represented by the absence of the row plus the emitted event.
  cancel(): void {
    this.props.updatedAt = new Date();
    this.addDomainEvent(
      new AppointmentCancelledEvent(
        this.props.id.getValue(),
        this.props.userId,
        this.props.updatedAt.toISOString(),
      ),
    );
  }

  updateNotes(notes?: string): void {
    this.props.notes = notes?.trim();
    this.props.updatedAt = new Date();
  }

  updateLocation(locationId?: string): void {
    this.props.locationId = locationId;
    this.props.updatedAt = new Date();
  }

  // Helper methods
  getDuration(): number {
    return this.props.endAt.getTime() - this.props.startAt.getTime();
  }

  getDurationInMinutes(): number {
    return this.getDuration() / (1000 * 60);
  }

  getDurationInHours(): number {
    return this.getDuration() / (1000 * 60 * 60);
  }

  isPast(): boolean {
    return this.props.endAt < new Date();
  }

  isUpcoming(): boolean {
    return this.props.startAt > new Date();
  }

  isOngoing(): boolean {
    const now = new Date();
    return this.props.startAt <= now && this.props.endAt >= now;
  }

  isStylistAppointment(): boolean {
    return this.props.type.isStylist();
  }

  isInStoreAppointment(): boolean {
    return this.props.type.isInStore();
  }

  conflictsWith(other: Appointment): boolean {
    return (
      (this.props.startAt >= other.startAt &&
        this.props.startAt < other.endAt) ||
      (this.props.endAt > other.startAt && this.props.endAt <= other.endAt) ||
      (this.props.startAt <= other.startAt && this.props.endAt >= other.endAt)
    );
  }

  equals(other: Appointment): boolean {
    return this.props.id.equals(other.props.id);
  }

  static toDTO(entity: Appointment): AppointmentDTO {
    return {
      id: entity.props.id.getValue(),
      userId: entity.props.userId,
      type: entity.props.type.getValue(),
      startAt: entity.props.startAt.toISOString(),
      endAt: entity.props.endAt.toISOString(),
      locationId: entity.props.locationId,
      notes: entity.props.notes,
      createdAt: entity.props.createdAt.toISOString(),
      updatedAt: entity.props.updatedAt.toISOString(),
    };
  }
}

// ============================================================================
// 6. Supporting input types
// ============================================================================
export interface CreateAppointmentData {
  userId: string;
  type: AppointmentType;
  locationId?: string;
  startAt: Date;
  endAt: Date;
  notes?: string;
}
